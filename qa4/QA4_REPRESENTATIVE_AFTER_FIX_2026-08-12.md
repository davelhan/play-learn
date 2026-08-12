# PLAY//LEARN — QA4 Representative Pedagogy Audit · After Fix

**Date:** 2026-08-12  
**Scope:** the same 10 representative missions audited before the QA4 repair pass  
**Baseline:** 3 PASS · 1 MINOR · 5 REWORK · 1 BLOCKER

## Post-fix result

**9 PASS · 1 MINOR · 0 REWORK · 0 BLOCKER**

This is a source/logic/pedagogy re-audit, not a claim of human game-feel validation. The full browser regression also passed after the repair: 51/51 shared-engine missions and 9/9 custom missions completed their automated end-to-end paths.

The dedicated `QA4 Representative Pedagogy Guard` workflow also passes and now protects the repaired design invariants from regression.

## Mission verdicts

| Mission | After fix | Change |
|---|---:|---|
| 01.01 SYSTEM LAYERS | PASS | Unchanged; strong causal foundation. |
| 02.04 WORKSPACE & REACH | PASS | Unchanged; spatial target and joint geometry remain strong. |
| 03.02 MOTOR VS TRANSMISSION | PASS | Free motor-torque/motor-speed upgrades removed. Learner now selects a motor family with fixed torque, speed, inertia and mass, then chooses ratio under a motor-mass budget. |
| 04.03 FOOT PLACEMENT | PASS | Exact numeric CAPTURE POINT metric removed. The scene shows a spatial recovery region instead of a number to copy. |
| 05.04 STATE ESTIMATION | MINOR | Completion contradiction removed: nominal and transfer now both bound estimator uncertainty width. Controls were relabeled as intuitive model-drift / measurement-caution choices before naming Q/R. Still an intentionally simplified estimator model. |
| 06.03 BANDWIDTH, LATENCY & SATURATION | PASS | Added minimum useful motion score. Minimum frequency + minimum amplitude no longer solves the mission. |
| 07.03 REGENERATION & POWER FLOW | PASS | Added finite hardware budget plus explicit regen/mechanical-braking allocation. Maximizing charge acceptance and buffer capacity is no longer a free optimum. |
| 08.04 HANDOVER & HRI | PASS | Unchanged; evidence → HOLD/RELEASE remains a strong discrete decision. |
| 09.02 PROTECTIVE STOPS & STO | PASS | Added minimum useful approach speed and protective-zone constraint. Slowing arbitrarily toward zero no longer satisfies the mission objective. |
| 10.01 EVIDENCE DISCIPLINE | PASS | Added underclaim penalty and claim-fit objective. CLAIM STRENGTH = 0 no longer passes; learner must make the strongest defensible claim near supported confidence. |

## System-level changes

### 03.02 — motor packages instead of fabricated motors
The player chooses FAST / BALANCED / TORQUE motor families. Each family has fixed torque, speed, reflected-inertia coefficient and mass. Gear ratio remains a player decision. Torque, speed, inertia and mass requirements must all pass together.

### 04.03 — spatial evidence instead of numeric answer
The exact capture-point value is no longer displayed. The central visualization highlights the recovery region and the learner places the foot spatially. Numeric error/margin remain diagnostic evidence, not the target answer itself.

### 05.04 — pass logic now matches visible estimator quality
`UNCERTAINTY WIDTH` is constrained in both nominal and transfer validation. A transfer cannot complete while the visible uncertainty metric is red. The transfer also requires the slip-aware contact model and a changed model/measurement weighting relationship.

### 06.03 — stability must still perform work
A read-only minimum useful-motion score is now imposed. Frequency and amplitude must produce enough task motion while also satisfying phase, bandwidth and actuator-demand limits.

### 07.03 — regeneration is an allocation problem
Charge-accept hardware and buffer capacity consume a finite budget. A separate BRAKING SENT TO REGEN control determines how much braking power is routed electrically versus mechanically. Near-full SoC forces a real reallocation.

### 09.02 — safety and throughput are coupled
The protective-stop mission now includes minimum useful approach speed, braking authority and protective-zone length. The learner must find a useful operating point that can still stop safely.

### 10.01 — strongest defensible claim
The goal is now a narrow band around evidence-supported confidence. Overclaim and underclaim are both visible. Silence/zero claim is not rewarded.

## Regression protection

The new `scripts/qa4-representative-audit.mjs` guard checks that these repaired properties remain present:

- 03.02 uses a motor-family choice and no independent motor torque/speed sliders.
- 04.03 does not expose a CAPTURE POINT answer metric.
- 05.04 nominal and transfer both bound estimator uncertainty width.
- 06.03 includes useful-performance requirements.
- 07.03 includes finite budget and regen allocation.
- 09.02 includes minimum useful operating speed.
- 10.01 penalizes underclaim and matches the claim to supported evidence.

## Remaining representative risk

**05.04 remains MINOR**, not because of a known contradiction or soft-lock, but because state-estimation tuning is still intrinsically abstract in this shared-engine presentation. A future richer visualization could animate prediction, measurement, innovation and estimate update over time rather than representing them primarily as live scalar evidence.

## Conclusion

The representative sample no longer contains a known dominant-extreme solution or pass/metric contradiction. The next QA step can move beyond this 10-mission sample and inspect the remaining 50 missions for the same two classes of defect:

1. a player variable with an obviously beneficial extreme and no cost;
2. a displayed failure metric that is not actually enforced by mission completion.
