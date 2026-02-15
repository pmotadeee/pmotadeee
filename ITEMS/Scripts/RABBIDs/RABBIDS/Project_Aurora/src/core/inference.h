#ifndef INFERENCE_H
#define INFERENCE_H

typedef enum {
    POLICY_LOW,
    POLICY_MEDIUM,
    POLICY_HIGH,
    POLICY_PANIC
} PolicyKey;

PolicyKey Inference_DeterminePolicy();

#endif
