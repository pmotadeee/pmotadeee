# Open DeepNude

Hi everyone! Ever heard of [Streisand effect](https://en.wikipedia.org/wiki/Streisand_effect)? Once it's online it will be around forever.

Get head out of your ass, or continue panicing over nothing. The choice is yours!

People on 4chan have been doing it for years manually in Photoshop. And the manual results were typically better, so why the commotion? Hmm...maybe because [SCARY TOXIC MACHINE LEARNING headline](sensationalist_journalism.png) get good click-through rate? ;)

## About this Repository

Shitposting aside, this is a work-in-progress open-source reimplementation of DeepNude based on reverse-engineering the original. Unfortunately the original code was obfuscated and parts were irreversibly Cythonized. These will need to be manually decompiled at a later time. 

Nevertheless the main neural network architecture is available in `textsubline`. The trained model is stored in 3 large pickles, `cm.lib`, `mm.lib`, `mn.lib`. Unfortunately the original author has taken down his AWS bucket; however there are [still many copies of it online](https://mega.nz/#!VwgHSKxT!9bFR5EhH7z1FjWaCoG66TJPC8Pp_yifryockXCBzXCU). I will consider rehosting if there is a large demand.

## Why?

I don't care at all about the nudes. However I believe that it is stupid that upset people are trying to keep it unavailable. Trying to take down or censor knowledge about the technology will not prevent it from proliferating. Information wants to be free! By creating trivial or superficial obstacles for people, such as taking down a download link, you are practicing security by obscurity. That is my core grievance with the current situation, so I am publishing this to discourage people from adopting that mindset. You made the weapons, now live with it.
