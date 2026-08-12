# PLAY//LEARN — QA4 Representative Pedagogy Audit

**Date:** 2026-08-12  
**Scope:** 10 representative missions, one per Act  
**Purpose:** move beyond browser solvability and ask whether the interaction itself teaches the intended concept.

## Executive result

**3 PASS · 1 MINOR · 5 REWORK · 1 BLOCKER**

The current build remains technically stable (the latest full Chromium regression passed 51/51 shared-engine + 9/9 custom missions), but this representative pedagogy pass found a recurring design problem: several shared-engine missions can be solved by pushing a variable toward an obvious extreme, with no meaningful cost for doing so. That produces a technically valid state without requiring the learner to understand the intended engineering trade-off.

A second systemic issue is rhythm: the shared engine uses the same pattern repeatedly — explore every control, deliberately cross a failure boundary, recover, then adapt to a disturbance. The structure is good as scaffolding but risks becoming ritualistic across dozens of missions.

## Mission verdicts

| Mission | Verdict | Interaction | Pedagogy | UX / rhythm | Main issue |
|---|---:|---|---|---|---|
| 01.01 SYSTEM LAYERS | PASS | Strong causal sequence | Strong | Slightly click-heavy but consolidated | Keep |
| 02.04 WORKSPACE & REACH | PASS | Spatial arm + fixed WORLD target | Strong | Good first shared-engine example | Keep |
| 03.02 MOTOR VS TRANSMISSION | REWORK | Three sliders | Weak trade-off | Dashboard-like | Motor torque and motor speed are independent free upgrades; maxing both has no cost |
| 04.03 FOOT PLACEMENT | MINOR | Spatial concept but numeric matching | Correct | Guided / somewhat answer-revealing | CAPTURE POINT is displayed as the exact target value, so learner can copy the number into NEXT FOOT X |
| 05.04 STATE ESTIMATION | BLOCKER | Abstract parameter tuning | Contradictory transfer validation | High cognitive load | Transfer can PASS while COVARIANCE remains explicitly outside target; Q/R labels also arrive before intuitive experience |
| 06.03 BANDWIDTH, LATENCY & SATURATION | REWORK | Two sliders | Monotonic / trivial | Repetitive | Minimum frequency + minimum amplitude is always a winning direction; no useful-performance floor exists |
| 07.03 REGENERATION & POWER FLOW | REWORK | Capacity sliders | Monotonic / trivial | Dashboard-like | Max charge acceptance + max dump capacity has no penalty, so the engineering decision collapses into “maximize both” |
| 08.04 HANDOVER & HRI | PASS | Evidence → explicit HOLD/RELEASE decision | Strong | Clear and readable | Keep |
| 09.02 PROTECTIVE STOPS & STO | REWORK | Speed + deceleration | Incomplete trade-off | Clear but too easy | Very low speed is always safe; no throughput / useful-speed requirement forces a real safety-performance decision |
| 10.01 EVIDENCE DISCIPLINE | REWORK | One claim-strength slider | Too trivial | Very short | CLAIM STRENGTH = 0 always passes. The game rewards making no useful claim rather than the strongest defensible claim |

## Detailed findings

### 01.01 — PASS
The mission still has one of the strongest learning structures in the campaign. The learner first tries a deliberately invalid shortcut, then watches mission intent transform through Behavior → State → Motion → Control → Plant, compares two removed functions, and finally transfers the same architecture to a new task. The final transfer is now paced layer-by-layer rather than disappearing immediately into completion.

Residual risk: processing each layer is still button-driven. This is acceptable here because the content of the transformation is the object of learning and the mission is the campaign foundation.

### 02.04 — PASS
The QA3 redesign solved the earlier fake-workspace problem. The target is now fixed in WORLD at `(x,z)` and the learner changes shoulder/elbow configuration. Hand position is genuinely derived from two-link forward kinematics; target error and joint-limit margin respond to posture. The transfer moves the WORLD target and adds a singularity condition.

This is the best current example of what the shared engine can do when its central visualization is genuinely causal.

### 03.02 — REWORK
The intended lesson is good: a transmission trades output torque for speed and changes reflected inertia. But the learner directly controls MOTOR TORQUE, MOTOR SPEED and GEAR RATIO as independent sliders.

This creates a dominant strategy: increase motor torque and motor speed, then choose any ratio that satisfies inertia. There is no mass, power, thermal, voltage or motor-family consequence for demanding a motor that is simultaneously stronger and faster.

**Required redesign:** motor capability should come from a finite motor choice or a torque-speed/power envelope. The learner should select a motor and tune ratio, not manufacture an arbitrarily better motor with two independent sliders.

### 04.03 — MINOR
The capture-point concept is correct and spatially meaningful. Push speed is imposed and the learner moves COM height and the next foot position.

However, the dashboard explicitly displays `CAPTURE POINT` numerically while the goal is simply to make `NEXT FOOT X` nearly equal to that value. A learner can solve by copying the number without understanding why the recovery zone moved.

**Recommended polish:** during APPLY, show the capture region visually but hide the exact numeric capture-point value until after the learner validates the placement. The reflection can then reveal the equation/value.

### 05.04 — BLOCKER
The mission attempts to teach prediction, measurement, innovation and uncertainty through CONTACT MODEL, PROCESS UNCERTAINTY and MEASUREMENT UNCERTAINTY.

Two problems remain:

1. The control labels are already technical (`PROCESS UNCERTAINTY`, `MEASUREMENT UNCERTAINTY`) before the learner has an intuitive experience of “trust prediction vs trust measurement”.
2. More importantly, the TRANSFER goal can pass while the displayed COVARIANCE metric is still red/outside target. Example: with SLIP-AWARE, processQ = 3 and measureR = 3, the transfer bias and normalized-innovation checks pass, while covariance = 1.5 and the metric target is `< 1`.

That means the mission can explicitly show a failed estimator-quality metric and still accept completion.

**Required redesign/fix:** transfer validation must include bounded covariance, and the first interaction should use intuitive trust/prediction/measurement behavior before naming Q/R.

### 06.03 — REWORK
The causal equations are coherent: latency creates phase loss and frequency × amplitude creates command demand. But there is no minimum useful motion requirement.

At nominal conditions and after the latency disturbance, the learner can reduce MOTION FREQUENCY and MOTION AMPLITUDE to their minimum values and trivially satisfy every constraint. The game therefore teaches “do almost nothing” rather than “find the maximum useful motion that remains controllable”.

**Required redesign:** impose a task-performance requirement — minimum frequency, minimum trajectory amplitude, cycle-time requirement, or a target motion envelope — so stability/saturation must be balanced against useful performance.

### 07.03 — REWORK
The mission correctly distinguishes regeneration from battery charge acceptance and introduces dump/buffer capacity. The problem is authority/cost: both CHARGE ACCEPT LIMIT and DUMP / BUFFER CAPACITY are free sliders with no downside.

The obvious solution is to maximize both. Near-full SoC then ceases to be a design decision.

**Required redesign:** give the learner a finite mass/cost/thermal budget, fixed hardware options, or an additional control such as commanded regenerative braking / mechanical braking split. The interesting choice is how returned power is managed, not whether two free capacities should be maximized.

### 08.04 — PASS
This mission has a clear scenario distinction: HUMAN PULL FORCE and INTENT CONFIDENCE are read-only evidence; the learner controls ROBOT GRIP and HOLD/RELEASE.

Nominal transfer requires both physical and intent evidence before release. The disturbance reduces intent confidence and the correct action becomes HOLD. This is a real decision rather than a scalar optimization and maps well to the concept.

### 09.02 — REWORK
Stopping-distance logic is correct and the low-friction disturbance lowers available safe deceleration. But the learner controls speed with no throughput or mission-performance floor.

The always-safe direction is therefore to reduce speed toward the minimum. This demonstrates the equation but not the engineering trade-off.

**Required redesign:** impose a minimum useful approach speed / cycle-time requirement, or ask the learner to maximize safe speed for a fixed protective zone. The objective should become “fastest safe operation inside this stop envelope”, not merely “make stopping distance small”.

### 10.01 — REWORK
The principle is important: claim confidence must not exceed available evidence. But the goal only penalizes overclaim.

Setting CLAIM STRENGTH to zero always passes, independent of evidence quality. That rewards saying nothing rather than making the strongest defensible engineering claim.

**Required redesign:** require claim strength to fall inside a narrow defensible band around supported confidence, or ask the learner to select the strongest claim that the evidence supports. Underclaim should create its own decision cost.

## Systemic findings

### A. Dominant extremes
The major recurring defect is not “sliders are bad”; it is that some sliders have only one beneficial direction and no cost. When the learner can always choose minimum speed, maximum capacity, maximum motor performance or zero claim strength, there is no engineering decision left.

Rule for future/shared missions:

> Every player-controlled continuous variable should either have a meaningful downside at both extremes, or participate in a constrained budget / task-performance requirement.

### B. Shared-engine ritual
The current runtime enforces:

1. EXPLORE every control.
2. In APPLY, observe at least one failing state.
3. Exercise every control referenced by the goal.
4. Recover a valid state.
5. Apply a disturbance.
6. Make a meaningful adaptation.

This creates excellent anti-cheese validation, but across many missions it can become a visible game rule rather than natural problem solving. Some missions should begin already failed; some should be optimization tasks; some should be diagnosis; some should be discrete decisions; some should ask for maximum safe performance. The validation engine can remain shared while the visible mission rhythm varies.

## QA4 conclusion

The campaign is **not blocked technically**. It is ready for continued pedagogical rework.

The representative sample indicates that the next work should not be visual polish or more content. Priority should be:

1. Fix 05.04 contradiction.
2. Remove dominant-extreme solutions in 03.02, 06.03, 07.03, 09.02 and 10.01.
3. Hide the direct numeric answer in 04.03 Apply.
4. Diversify shared-engine mission rhythm without weakening anti-cheese validation.
5. Re-run this exact 10-mission QA before sampling the remaining 50.
