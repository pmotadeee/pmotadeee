//+------------------------------------------------------------------+
//|                                                  TrailingStopEA.mq5 |
//|                        Copyright 2023, MetaQuotes Software Corp. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Software Corp."
#property link      "https://www.mql5.com"
#property version   "2.00"

//--- Includes
#include <Trade\Trade.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- Input parameters com polimorfismo para diferentes brokers
input group "=== CONFIGURAÇÃO PRINCIPAL ==="
input double   TrailingActivation = 5.0;    // Ativação do trailing em percentual
input double   TrailingDistance   = 3.0;    // Distância do trailing em percentual
input double   InitialStopLoss    = 10.0;   // Stop loss inicial em percentual
input double   InitialTakeProfit  = 20.0;   // Take profit inicial em percentual
input double   TpExpansion        = 2.5;    // Expansão do TP (multiplicador)
input double   SlProgressive      = 1.3;    // Progressão do SL (multiplicador)

input group "=== CONFIGURAÇÃO BROKER ADAPTATIVA ==="
input string   BrokerProfile      = "AUTO"; // AUTO, BROKER_A, BROKER_B
input double   LotSize_BROKER_A   = 0.1;    // Lote para Broker A
input double   LotSize_BROKER_B   = 0.01;   // Lote para Broker B
input int      Magic_BROKER_A     = 1001;   // Magic Number Broker A  
input int      Magic_BROKER_B     = 2001;   // Magic Number Broker B

input group "=== CONFIGURAÇÃO DE RISCO ==="
input double   RiskPercent        = 2.0;    // Risco por trade em %
input bool     UseMoneyManagement = true;   // Usar gestão de capital
input double   MaxLotSize         = 1.0;    // Tamanho máximo do lote

//--- Variáveis globais - AS ENGRENAGENS DO SISTEMA
double         activationPrice;             // Preço de ativação do trailing
double         trailingPrice;               // Distância de trailing em preço
double         initialSlPrice;              // Stop loss inicial em preço
double         initialTpPrice;              // Take profit inicial em preço
ulong          currentMagicNumber;          // Magic Number dinâmico
double         currentLotSize;              // Lote dinâmico

//--- Handles para indicadores
int            atrHandle;
int            emaFastHandle, emaSlowHandle;

//--- Classes MQL5 para trading
CTrade         trade;                       // Classe CTrade para operações
CSymbolInfo    symbolInfo;                  // Informações do símbolo
CAccountInfo   accountInfo;                 // Informações da conta
CPositionInfo  positionInfo;                // Informações de posição

//--- Flags e estados
bool           isOrderPending = false;      // Flag para ordem pendente
bool           isHedgingAccount = false;    // Tipo de conta
datetime       lastTradeTime = 0;           // Último tempo de trade
int            pendingOrders = 0;           // Contador de ordens pendentes

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== INICIALIZANDO TRAILING STOP EA v2.0 ===");
   
   //--- Inicializar classes MQL5
   if(!symbolInfo.Name(_Symbol))
      return INIT_FAILED;
   
   symbolInfo.Refresh();
   
   //--- CONFIGURAÇÃO ADAPTATIVA DE BROKER (POLIMORFISMO)
   ConfigureBrokerSettings();
   
   //--- CONFIGURAR CLASSE TRADE
   trade.SetExpertMagicNumber(currentMagicNumber);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   //--- DETECTAR TIPO DE CONTA (Hedging vs Netting)
   isHedgingAccount = IsHedgingAccount();
   Print("Tipo de conta: ", isHedgingAccount ? "HEDGING" : "NETTING");
   
   //--- INICIALIZAR INDICADORES
   atrHandle = iATR(_Symbol, _Period, 14);
   emaFastHandle = iEMA(_Symbol, _Period, 8, 0, MODE_EMA, PRICE_CLOSE);
   emaSlowHandle = iEMA(_Symbol, _Period, 21, 0, MODE_EMA, PRICE_CLOSE);
   
   //--- VERIFICAÇÃO DE SEGURANÇA
   if(!ValidateSettings())
   {
      Print("ERRO: Configurações inválidas detectadas!");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   //--- VALIDAR LIMITES DO SÍMBOLO
   if(!ValidateSymbolLimits())
   {
      Print("ERRO: Limites do símbolo inválidos!");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   Print("EA Inicializado - Magic: ", currentMagicNumber, " | Lote: ", currentLotSize);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| CONFIGURAÇÃO ADAPTATIVA DE BROKER                               |
//+------------------------------------------------------------------+
void ConfigureBrokerSettings()
{
   string brokerName = AccountInfoString(ACCOUNT_COMPANY);
   Print("Detectando Broker: ", brokerName);
   
   //--- LÓGICA DE POLIMORFISMO PARA DIFERENTES BROKERS
   if(BrokerProfile == "AUTO")
   {
      // Detecção automática baseada no nome do broker
      if(StringFind(brokerName, "IC Markets") >= 0 || StringFind(brokerName, "XM") >= 0)
      {
         currentMagicNumber = Magic_BROKER_A;
         currentLotSize = CalculateOptimalLotSize(LotSize_BROKER_A);
         Print("Configurado para BROKER_A - Lote: ", currentLotSize);
      }
      else if(StringFind(brokerName, "RoboForex") >= 0 || StringFind(brokerName, "Exness") >= 0)
      {
         currentMagicNumber = Magic_BROKER_B;
         currentLotSize = CalculateOptimalLotSize(LotSize_BROKER_B);
         Print("Configurado para BROKER_B - Lote: ", currentLotSize);
      }
      else
      {
         // Configuração padrão
         currentMagicNumber = GenerateDynamicMagicNumber();
         currentLotSize = CalculateOptimalLotSize(0.1);
         Print("Usando configuração PADRÃO - Magic: ", currentMagicNumber);
      }
   }
   else if(BrokerProfile == "BROKER_A")
   {
      currentMagicNumber = Magic_BROKER_A;
      currentLotSize = CalculateOptimalLotSize(LotSize_BROKER_A);
   }
   else if(BrokerProfile == "BROKER_B")
   {
      currentMagicNumber = Magic_BROKER_B;
      currentLotSize = CalculateOptimalLotSize(LotSize_BROKER_B);
   }
}

//+------------------------------------------------------------------+
//| GERAR MAGIC NUMBER DINÂMICO                                     |
//+------------------------------------------------------------------+
int GenerateDynamicMagicNumber()
{
   // Gera Magic Number único baseado no símbolo, timeframe e data
   string base = _Symbol + IntegerToString(_Period) + TimeToString(TimeCurrent(), TIME_DATE);
   int hash = 0;
   for(int i = 0; i < StringLen(base); i++)
      hash = 31 * hash + StringGetCharacter(base, i);
   
   return MathAbs(hash) % 1000000;
}

//+------------------------------------------------------------------+
//| CALCULAR LOTE OTIMIZADO COM GESTÃO DE RISCO                    |
//+------------------------------------------------------------------+
double CalculateOptimalLotSize(double baseLot)
{
   if(!UseMoneyManagement)
      return NormalizeLotSize(baseLot);
   
   //--- Cálculo baseado no risco percentual
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double stopLossPoints = initialSlPrice / SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   if(tickSize > 0 && tickValue > 0 && stopLossPoints > 0)
   {
      double riskMoney = AccountInfoDouble(ACCOUNT_BALANCE) * RiskPercent / 100.0;
      double lotSize = riskMoney / (stopLossPoints * tickValue * tickSize);
      lotSize = NormalizeLotSize(lotSize);
      return MathMin(lotSize, MaxLotSize);
   }
   
   return NormalizeLotSize(baseLot);
}

//+------------------------------------------------------------------+
//| NORMALIZAR TAMANHO DO LOTE COM LIMITES DO SÍMBOLO              |
//+------------------------------------------------------------------+
double NormalizeLotSize(double lot)
{
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   lot = MathMax(lot, minLot);
   lot = MathMin(lot, maxLot);
   lot = MathRound(lot / stepLot) * stepLot;
   
   return NormalizeDouble(lot, 2);
}

//+------------------------------------------------------------------+
//| DETECTAR TIPO DE CONTA                                         |
//+------------------------------------------------------------------+
bool IsHedgingAccount()
{
   return (ENUM_ACCOUNT_MARGIN_MODE)AccountInfoInteger(ACCOUNT_MARGIN_MODE) == ACCOUNT_MARGIN_MODE_RETAIL_HEDGING;
}

//+------------------------------------------------------------------+
//| VALIDAÇÃO DE CONFIGURAÇÕES                                     |
//+------------------------------------------------------------------+
bool ValidateSettings()
{
   if(TrailingActivation <= 0 || TrailingDistance <= 0)
   {
      Print("ERRO: TrailingActivation e TrailingDistance devem ser > 0");
      return false;
   }
   
   if(InitialStopLoss <= 0 || InitialTakeProfit <= 0)
   {
      Print("ERRO: StopLoss e TakeProfit iniciais devem ser > 0");
      return false;
   }
   
   if(currentLotSize <= 0)
   {
      Print("ERRO: Tamanho do lote inválido");
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| VALIDAR LIMITES DO SÍMBOLO                                     |
//+------------------------------------------------------------------+
bool ValidateSymbolLimits()
{
   //--- Verificar stops levels
   int stopsLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   int freezeLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_FREEZE_LEVEL);
   
   Print("Stops Level: ", stopsLevel, " | Freeze Level: ", freezeLevel);
   
   //--- Verificar volumes mínimos e máximos
   double minVolume = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxVolume = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepVolume = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   if(minVolume <= 0 || maxVolume <= 0 || stepVolume <= 0)
   {
      Print("ERRO: Limites de volume inválidos");
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| CALCULAR PONTOS DINAMICAMENTE - O CORAÇÃO DO SISTEMA           |
//+------------------------------------------------------------------+
void CalculateDynamicPoints()
{
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   
   //--- CÁLCULO DINÂMICO BASEADO NO PREÇO ATUAL (convertendo % para preço)
   activationPrice = (TrailingActivation / 100.0) * bid;
   trailingPrice = (TrailingDistance / 100.0) * bid;
   initialSlPrice = (InitialStopLoss / 100.0) * bid;
   initialTpPrice = (InitialTakeProfit / 100.0) * bid;
   
   //--- AJUSTE PARA VOLATILIDADE (USANDO ATR)
   double atrBuffer[];
   if(CopyBuffer(atrHandle, 0, 0, 1, atrBuffer) == 1)
   {
      double atrValue = atrBuffer[0];
      // Ajusta trailing baseado na volatilidade - mínimo entre ATR*1.5 e trailing calculado
      if(atrValue > 0)
      {
         trailingPrice = MathMax(trailingPrice, atrValue * 1.5);
      }
   }
   
   //--- ATUALIZAR LOTE COM GESTÃO DE RISCO
   if(UseMoneyManagement)
      currentLotSize = CalculateOptimalLotSize(currentLotSize);
}

//+------------------------------------------------------------------+
//| Expert tick function - O LOOP PRINCIPAL                        |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- ATUALIZAR ENGRENAGENS DO SISTEMA
   CalculateDynamicPoints();
   
   //--- ATUALIZAR INFORMAÇÕES DO SÍMBOLO
   symbolInfo.RefreshRates();
   
   //--- VERIFICAR SINAIS DE ENTRADA (SCALPING AUTOMÁTICO)
   if(!isOrderPending && (PositionsTotal() == 0 || isHedgingAccount))
      CheckEntrySignals();
   
   //--- GERENCIAR POSIÇÕES ABERTAS
   ManageOpenPositions();
}

//+------------------------------------------------------------------+
//| VERIFICAR SINAIS DE ENTRADA PARA SCALPING                      |
//+------------------------------------------------------------------+
void CheckEntrySignals()
{
   //--- EVITAR SOBREPOSIÇÃO - máximo 1 posição por MagicNumber em conta netting
   if(!isHedgingAccount && CountPositionsByMagic(currentMagicNumber) > 0)
      return;
   
   //--- OBTER DADOS DE MERCADO EM TEMPO REAL
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   CopyRates(_Symbol, _Period, 0, 3, rates);
   
   if(ArraySize(rates) < 3) return;
   
   //--- CALCULAR INDICADORES PARA DECISÃO
   double emaFast = iMA(_Symbol, _Period, 8, 0, MODE_EMA, PRICE_CLOSE, 0);
   double emaSlow = iMA(_Symbol, _Period, 21, 0, MODE_EMA, PRICE_CLOSE, 0);
   double rsi = iRSI(_Symbol, _Period, 14, PRICE_CLOSE, 0);
   
   //--- LÓGICA DE ENTRADA PARA SCALPING
   bool buySignal = emaFast > emaSlow && 
                   rsi > 30 && rsi < 70 &&
                   rates[1].close > rates[1].open;
   
   bool sellSignal = emaFast < emaSlow && 
                    rsi > 30 && rsi < 70 &&
                    rates[1].close < rates[1].open;
   
   //--- EXECUTAR ORDENS COM VALIDAÇÃO
   if(buySignal)
   {
      double entryPrice = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double sl = NormalizeDouble(entryPrice - initialSlPrice, _Digits);
      double tp = NormalizeDouble(entryPrice + initialTpPrice, _Digits);
      
      //--- VALIDAR STOP LOSS E TAKE PROFIT
      if(ValidateStopLossTakeprofit(ORDER_TYPE_BUY, entryPrice, sl, tp))
         OpenBuyPosition(entryPrice, sl, tp);
   }
   else if(sellSignal)
   {
      double entryPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double sl = NormalizeDouble(entryPrice + initialSlPrice, _Digits);
      double tp = NormalizeDouble(entryPrice - initialTpPrice, _Digits);
      
      if(ValidateStopLossTakeprofit(ORDER_TYPE_SELL, entryPrice, sl, tp))
         OpenSellPosition(entryPrice, sl, tp);
   }
}

//+------------------------------------------------------------------+
//| VALIDAR STOP LOSS E TAKE PROFIT                                |
//+------------------------------------------------------------------+
bool ValidateStopLossTakeprofit(ENUM_ORDER_TYPE orderType, double price, double sl, double tp)
{
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   int stopsLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDist = stopsLevel * point;
   
   if(orderType == ORDER_TYPE_BUY)
   {
      if(sl > 0 && (price - sl) < minDist)
      {
         Print("ERRO: Stop Loss muito próximo para compra. Distância: ", (price - sl)/point, " pontos");
         return false;
      }
      if(tp > 0 && (tp - price) < minDist)
      {
         Print("ERRO: Take Profit muito próximo para compra. Distância: ", (tp - price)/point, " pontos");
         return false;
      }
   }
   else if(orderType == ORDER_TYPE_SELL)
   {
      if(sl > 0 && (sl - price) < minDist)
      {
         Print("ERRO: Stop Loss muito próximo para venda. Distância: ", (sl - price)/point, " pontos");
         return false;
      }
      if(tp > 0 && (price - tp) < minDist)
      {
         Print("ERRO: Take Profit muito próximo para venda. Distância: ", (price - tp)/point, " pontos");
         return false;
      }
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| CONTAR POSIÇÕES POR MAGIC NUMBER                               |
//+------------------------------------------------------------------+
int CountPositionsByMagic(ulong magic)
{
   int count = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == magic)
         count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| GERENCIAR POSIÇÕES ABERTAS - O NÚCLEO DO TRAILING STOP        |
//+------------------------------------------------------------------+
void ManageOpenPositions()
{
   for(int i = PositionsTotal()-1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionSelectByTicket(ticket))
      {
         if(PositionGetInteger(POSITION_MAGIC) == currentMagicNumber)
         {
            string symbol = PositionGetString(POSITION_SYMBOL);
            double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
            double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double stopLoss = PositionGetDouble(POSITION_SL);
            double takeProfit = PositionGetDouble(POSITION_TP);
            
            //--- CALCULAR LUCRO EM PERCENTUAL
            double profitPercent = 0;
            if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
               profitPercent = (currentPrice - openPrice) / openPrice * 100;
            else if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
               profitPercent = (openPrice - currentPrice) / openPrice * 100;
            
            //--- APLICAR TRAILING STOP QUANDO ATINGIR ATIVAÇÃO
            if(profitPercent >= TrailingActivation)
            {
               double newStopLoss = 0;
               double newTakeProfit = 0;
               
               if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
               {
                  newStopLoss = NormalizeDouble(currentPrice - trailingPrice, _Digits);
                  // SÓ ATUALIZA SE O NOVO STOP LOSS FOR MAIOR QUE O ANTERIOR
                  if(newStopLoss > stopLoss || stopLoss == 0)
                  {
                     if(ModifyStopLoss(ticket, newStopLoss))
                     {
                        Print("Trailing Stop ATIVADO - Compra: ", DoubleToString(newStopLoss, _Digits));
                        
                        //--- TP EXPANSIVO: SÓ AUMENTAR, NUNCA DIMINUIR
                        newTakeProfit = NormalizeDouble(currentPrice + (initialTpPrice * TpExpansion), _Digits);
                        if(newTakeProfit > takeProfit || takeProfit == 0)
                        {
                           ModifyTakeProfit(ticket, newTakeProfit);
                           Print("TP Expandido para: ", DoubleToString(newTakeProfit, _Digits));
                        }
                     }
                  }
               }
               else if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
               {
                  newStopLoss = NormalizeDouble(currentPrice + trailingPrice, _Digits);
                  // SÓ ATUALIZA SE O NOVO STOP LOSS FOR MENOR QUE O ANTERIOR
                  if(newStopLoss < stopLoss || stopLoss == 0)
                  {
                     if(ModifyStopLoss(ticket, newStopLoss))
                     {
                        Print("Trailing Stop ATIVADO - Venda: ", DoubleToString(newStopLoss, _Digits));
                        
                        //--- TP EXPANSIVO: SÓ DIMINUIR (AUMENTAR VALOR ABSOLUTO PARA VENDA)
                        newTakeProfit = NormalizeDouble(currentPrice - (initialTpPrice * TpExpansion), _Digits);
                        if(newTakeProfit < takeProfit || takeProfit == 0)
                        {
                           ModifyTakeProfit(ticket, newTakeProfit);
                           Print("TP Expandido para: ", DoubleToString(newTakeProfit, _Digits));
                        }
                     }
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| MODIFICAR STOP LOSS - IMPLEMENTAÇÃO ROBUSTA COM CTrade        |
//+------------------------------------------------------------------+
bool ModifyStopLoss(ulong ticket, double newStopLoss)
{
   //--- VALIDAÇÃO DE SEGURANÇA
   double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   int stopsLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDist = stopsLevel * point;
   
   if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
   {
      if(newStopLoss >= currentPrice - minDist)
      {
         Print("ERRO: Stop Loss muito próximo do preço atual para compra");
         return false;
      }
   }
   else if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
   {
      if(newStopLoss <= currentPrice + minDist)
      {
         Print("ERRO: Stop Loss muito próximo do preço atual para venda");
         return false;
      }
   }
   
   //--- USAR CTrade PARA MODIFICAÇÃO (mais robusto)
   return trade.PositionModify(ticket, newStopLoss, PositionGetDouble(POSITION_TP));
}

//+------------------------------------------------------------------+
//| MODIFICAR TAKE PROFIT - SÓ AUMENTAR COM CTrade                |
//+------------------------------------------------------------------+
bool ModifyTakeProfit(ulong ticket, double newTakeProfit)
{
   return trade.PositionModify(ticket, PositionGetDouble(POSITION_SL), newTakeProfit);
}

//+------------------------------------------------------------------+
//| ABRIR POSIÇÃO DE COMPRA COM CTrade E VALIDAÇÃO               |
//+------------------------------------------------------------------+
bool OpenBuyPosition(double price, double sl, double tp)
{
   //--- VALIDAR REQUISIÇÃO ANTES DE ENVIAR
   MqlTradeRequest request = {};
   MqlTradeCheckResult checkResult = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = _Symbol;
   request.volume = currentLotSize;
   request.type = ORDER_TYPE_BUY;
   request.price = NormalizeDouble(price, _Digits);
   request.sl = NormalizeDouble(sl, _Digits);
   request.tp = NormalizeDouble(tp, _Digits);
   request.magic = currentMagicNumber;
   request.deviation = 10;
   request.type_filling = ORDER_FILLING_FOK;
   request.type_time = ORDER_TIME_GTC;
   request.comment = "Compra EA TrailingStop v2";
   
   //--- VALIDAÇÃO PRÉ-ENVIO (OrderCheck)
   if(!OrderCheck(request, checkResult))
   {
      Print("ERRO na validação da compra: ", checkResult.comment);
      return false;
   }
   
   //--- ENVIAR ORDEM
   MqlTradeResult result = {};
   isOrderPending = true;
   
   if(trade.Buy(currentLotSize, _Symbol, 0, sl, tp, "Compra EA TrailingStop v2"))
   {
      Print("COMPRA executada com SUCESSO");
      lastTradeTime = TimeCurrent();
      isOrderPending = false;
      return true;
   }
   else
   {
      Print("ERRO na compra: ", GetLastError(), " - ", trade.ResultRetcodeDescription());
      isOrderPending = false;
      return false;
   }
}

//+------------------------------------------------------------------+
//| ABRIR POSIÇÃO DE VENDA COM CTrade E VALIDAÇÃO               |
//+------------------------------------------------------------------+
bool OpenSellPosition(double price, double sl, double tp)
{
   MqlTradeRequest request = {};
   MqlTradeCheckResult checkResult = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = _Symbol;
   request.volume = currentLotSize;
   request.type = ORDER_TYPE_SELL;
   request.price = NormalizeDouble(price, _Digits);
   request.sl = NormalizeDouble(sl, _Digits);
   request.tp = NormalizeDouble(tp, _Digits);
   request.magic = currentMagicNumber;
   request.deviation = 10;
   request.type_filling = ORDER_FILLING_FOK;
   request.type_time = ORDER_TIME_GTC;
   request.comment = "Venda EA TrailingStop v2";
   
   //--- VALIDAÇÃO PRÉ-ENVIO (OrderCheck)
   if(!OrderCheck(request, checkResult))
   {
      Print("ERRO na validação da venda: ", checkResult.comment);
      return false;
   }
   
   //--- ENVIAR ORDEM
   MqlTradeResult result = {};
   isOrderPending = true;
   
   if(trade.Sell(currentLotSize, _Symbol, 0, sl, tp, "Venda EA TrailingStop v2"))
   {
      Print("VENDA executada com SUCESSO");
      lastTradeTime = TimeCurrent();
      isOrderPending = false;
      return true;
   }
   else
   {
      Print("ERRO na venda: ", GetLastError(), " - ", trade.ResultRetcodeDescription());
      isOrderPending = false;
      return false;
   }
}

//+------------------------------------------------------------------+
//| OnTradeTransaction - HANDLER DE EVENTOS DE TRADING            |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                       const MqlTradeRequest& request,
                       const MqlTradeResult& result)
{
   //--- LOG DE TODAS AS TRANSAÇÕES
   Print("Trade Transaction: ", EnumToString(trans.type), 
         " | Order: ", trans.order, 
         " | Deal: ", trans.deal,
         " | Volume: ", trans.volume);
   
   //--- ATUALIZAR ESTADOS BASEADO NAS TRANSAÇÕES
   switch(trans.type)
   {
      case TRADE_TRANSACTION_ORDER_ADD:
         pendingOrders++;
         break;
         
      case TRADE_TRANSACTION_ORDER_DELETE:
         pendingOrders = MathMax(0, pendingOrders - 1);
         break;
         
      case TRADE_TRANSACTION_DEAL_ADD:
         if(trans.deal_type == DEAL_TYPE_ENTRY_IN)
         {
            Print("NOVA POSIÇÃO ABERTA - Deal: ", trans.deal);
            isOrderPending = false;
         }
         break;
         
      case TRADE_TRANSACTION_POSITION_MODIFY:
         Print("POSIÇÃO MODIFICADA - Position: ", trans.position);
         break;
   }
}

//+------------------------------------------------------------------+
//| OnTrade - HANDLER DE EVENTOS DE CONTA                         |
//+------------------------------------------------------------------+
void OnTrade()
{
   //--- ATUALIZAR INFORMAÇÕES DA CONTA QUANDO HOUVER MUDANÇAS
   accountInfo.Refresh();
   Print("Saldo da conta atualizado: ", accountInfo.Balance());
}

//+------------------------------------------------------------------+
//| OnTimer - ATUALIZAÇÕES PERIÓDICAS                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   //--- ATUALIZAR ESTATÍSTICAS A CADA SEGUNDO
   static int lastUpdate = 0;
   int currentSecond = (int)TimeCurrent();
   
   if(currentSecond - lastUpdate >= 1)
   {
      //--- ATUALIZAR LOTE COM GESTÃO DE RISCO DINÂMICA
      if(UseMoneyManagement)
         currentLotSize = CalculateOptimalLotSize(currentLotSize);
      
      lastUpdate = currentSecond;
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                               |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("=== EA FINALIZADO - Razão: ", GetUninitReasonText(reason), " ===");
   
   //--- LIBERAR INDICADORES
   IndicatorRelease(atrHandle);
   IndicatorRelease(emaFastHandle);
   IndicatorRelease(emaSlowHandle);
   
   //--- FECHAR TODAS AS POSIÇÕES DO EA (OPCIONAL)
   if(reason == REASON_REMOVE)
   {
      Print("Fechando todas as posições do EA...");
      CloseAllPositions();
   }
}

//+------------------------------------------------------------------+
//| FECHAR TODAS AS POSIÇÕES DO EA                                |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = PositionsTotal()-1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == currentMagicNumber)
      {
         if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
            trade.Sell(PositionGetDouble(POSITION_VOLUME), _Symbol);
         else if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_SELL)
            trade.Buy(PositionGetDouble(POSITION_VOLUME), _Symbol);
      }
   }
}

//+------------------------------------------------------------------+
//| DESCRIÇÃO DAS RAZÕES DE DEINIT                                |
//+------------------------------------------------------------------+
string GetUninitReasonText(int reason)
{
   switch(reason)
   {
      case REASON_ACCOUNT:    return "Conta alterada";
      case REASON_CHARTCHANGE: return "Símbolo ou timeframe alterado";
      case REASON_CHARTCLOSE:  return "Chart fechado";
      case REASON_PARAMETERS:  return "Parâmetros alterados";
      case REASON_RECOMPILE:   return "EA recompilado";
      case REASON_REMOVE:      return "EA removido";
      case REASON_INITFAILED:  return "Inicialização falhou";
      default:                 return "Razão desconhecida";
   }
}

//+------------------------------------------------------------------+
//| DESCRIÇÃO DOS CÓDIGOS DE RETORNO DO TRADE                     |
//+------------------------------------------------------------------+
string GetRetcodeDescription(int retcode)
{
   return trade.ResultRetcodeDescription(retcode);
}
//+------------------------------------------------------------------+cd