# PLAY//LEARN — QA5 Remaining 50 Mission Pedagogy Audit

**Date:** 2026-08-12  
**Scope:** the 50 missions not included in the QA4 representative sample  
**Method:** automated heuristic scan of the 42 remaining shared-engine missions + manual source/interaction-flow triage of all flags + manual review of the 8 remaining custom missions.

## Final triaged result

**17 PASS · 21 MINOR · 12 REWORK · 0 BLOCKER**

The raw scanner intentionally over-reported: 34/42 shared missions were flagged because it treats every extreme solution and every red metric inside a passing state as suspicious. Manual review separated real design defects from legitimate threshold cases, intentional degraded-world evidence, and coarse-grid false positives.

There are **no newly discovered hard blockers or unsolvable missions**. The latest Chromium regression already proves the runtime paths complete. QA5 is about whether the interaction teaches the intended engineering decision rather than merely accepting a mathematically legal state.

## The 12 missions that genuinely need REWORK

### 03.01 — TORQUE & INERTIA
**Problem:** minimum mass + minimum moment arm + minimum acceleration is an obvious dominant solution. The player can remove the task instead of understanding torque demand.

**Rework:** impose payload/task acceleration as WORLD evidence, or introduce a useful-task requirement / mass-placement budget. The learner should manage geometry and actuator demand, not make the robot carry almost nothing and accelerate at zero.

### 03.04 — CONTINUOUS VS PEAK
**Problem:** reducing requested torque toward minimum is always beneficial; cooling is also effectively a free upgrade. The nominal case is so loose that both low and high extreme corners can pass.

**Rework:** impose a required task torque/output and let the learner size actuator/cooling or duty strategy. Repetition should force a continuous-rating decision while peak capability remains fixed.

### 03.06 — ACTUATION GATE
**Problem:** several Gate cases collapse into one-direction sizing: max ratio for load, min ratio for agility, min speed for power. The final power/thermal case can also pass while the displayed thermal metric remains outside its nominal target.

**Rework:** require useful speed/output in the power case, align thermal validation with the displayed target, and combine at least two competing actuator constraints per case.

### 04.04 — GAIT & WHOLE-BODY CONTROL
**Problem:** max speed + max foot clearance + max swing time can pass. Clearance and timing have no meaningful cost, so the intended whole-body scheduling trade-off is weak.

**Rework:** couple swing time to cycle time / forward-speed requirement, and make excessive clearance consume energy, impact or timing margin.

### 05.05 — PERCEPTION UNDER UNCERTAINTY
**Problem:** planned clearance can simply be maximized. Even maximum speed remains safe when clearance is also maxed, because route width / path efficiency has no cost.

**Rework:** impose corridor width or path-length cost and a minimum useful speed. The learner should trade uncertainty buffer against throughput and available space.

### 06.04 — NESTED LOOPS & REAL TIME
**Problem:** after the jitter disturbance, minimum inner rate + minimum outer rate passes. The transfer dropped the nominal minimum functional inner-loop rate, so the player can solve compute pressure by making both loops nearly useless.

**Rework:** retain functional minimum rates and/or task bandwidth requirements while respecting CPU and deadline budgets.

### 06.06 — CONTROL GATE
**Problem:** the real-time hierarchy Gate inherits the same all-minimum loop-rate solution as 06.04. Some other cases are legitimate thresholds, but the Gate should test useful control performance, not only resource reduction.

**Rework:** mirror the repaired 06.04 functional-rate floor and keep CPU/deadline constraints active in the Gate.

### 07.02 — BATTERY & BMS
**Problem:** higher voltage and higher capacity are both free improvements. Maxing both reduces current and increases energy simultaneously. Transfer can also complete while STORED ENERGY and RESERVE ENERGY cards remain red.

**Rework:** add pack mass/cost/volume budget or discrete pack choices; align transfer validation with visible energy/reserve evidence.

### 07.04 — HEAT & COOLING
**Problem:** lower thermal resistance and stronger cooling are effectively free design improvements. The mission teaches the equation but not an engineering allocation decision.

**Rework:** add cooling power, mass, vent-area or package budget so thermal resistance and active cooling compete with something useful.

### 07.06 — ENERGY GATE
**Problem:** the three sizing cases encourage max energy, max bus voltage and max regen buffer independently. The Gate can be cleared by over-sizing each axis without a common architecture budget.

**Rework:** introduce a shared mass/cost/volume budget or require minimum sufficient sizing rather than maximum capability. Reuse the energy/power/regen/thermal decisions from the repaired Act missions.

### 08.02 — UNDERACTUATION & TACTILE
**Problem:** after tactile degradation, minimum tendon tension + minimum compliance can pass while CONFORMITY and SLIP DETECTION remain visibly outside target. The mission therefore rewards a weak hand configuration.

**Rework:** enforce conformance/slip evidence in transfer and create a real tension/compliance window rather than letting both controls collapse to minimum.

### 09.06 — SAFETY GATE
**Problem:** minimum speed trivially passes protective stopping; maximum reliability/test coverage trivially passes other cases. The Gate lost the throughput and finite-budget trade-offs repaired in 09.02/09.04/09.05.

**Rework:** require useful operating speed, lifecycle/reliability budget and finite V&V allocation inside the Gate cases.

## 21 MINOR missions

These do not need structural redesign before playtest, but they contain threshold/UI consistency or residual rhythm issues.

| Mission | Minor issue |
|---|---|
| 01.02 | Strong concept, but still somewhat command-pulse/script heavy. |
| 01.05 | Real pace trade-off works; requirement negotiation remains authored rather than systemic. |
| 01.06 | Integrated Gate works, but still has a four-station exam feel. |
| 02.05 | Transfer can pass with ELBOW CLEARANCE below the metric card's nominal green threshold. Align thresholds. |
| 04.02 | Wet-floor transfer accepts a lower friction margin than the metric card marks green. Align phase target. |
| 04.05 | Recovery boundary is meaningful, but STEP REACH and UPPER-BODY HELP are free capability sliders; keep under observation. |
| 05.02 | APPLY permits time misalignment up to 22 ms while the card turns red above 18 ms. |
| 05.03 | Degraded-vision transfer correctly shifts almost all trust to IMU, but the nominal metric colors make valid degraded states appear red; prevent exactly 100% single-sensor trust or use phase-aware targets. |
| 06.02 | In IMPEDANCE transfer, TRACKING ERROR is intentionally no longer the objective but still appears red. Mark irrelevant evidence N/A or use phase-aware metric status. |
| 07.01 | Energy vs peak-power distinction is correct, but battery energy itself has no mass/cost penalty; acceptable for DISCOVER, not ideal sizing gameplay. |
| 08.03 | Hybrid force/motion logic is correct; temporal force-loop feel remains simplified. |
| 08.05 | Transfer intentionally relaxed motion/cooling/sealing thresholds even though the original green thresholds remain feasible. Align them to avoid three red cards in a valid solution. |
| 08.06 | SERVICE INTERFACE Gate case is essentially “increase access”; add one competing package constraint if polishing the Gate. |
| 09.01 | MITIGATION COST card uses `< budget` while completion allows `<= budget`; exact-budget solutions look red. |
| 09.03 | Common-cause transfer intentionally accepts degraded top-event probability, but nominal green thresholds remain displayed. Use phase-aware accepted/degraded status. |
| 09.04 | Transfer allows >95% availability while the card requires >97%; >97% is still achievable, so align target. |
| 09.05 | TEST COST card uses `< budget` while completion allows `<= budget`; scanner's “no solution” was a coarse-grid false positive. |
| 10.02 | REVIEW EFFORT has the same `<` vs `<=` boundary issue. Red READINESS during a correct HOLD decision is intentional and should be labeled as evidence, not player failure. |
| 10.03 | Transfer relaxes four envelope thresholds even though the original green envelope is still solvable. Align completion to visible targets. |
| 10.05 | RETEST COST uses `< budget` while completion permits `<=`; high traceability is intentional under the finite budget. |
| 10.06 | Cross-domain capstone is valid; the remaining limitation is that prior robot-build state is not yet materially persistent/tangible during the final defense. |

## 17 PASS missions

No dominant-extreme or completion/visible-evidence contradiction requiring action was found in this QA scope.

- 01.03 TRACE THE BROKEN LAYER
- 01.04 BUILD THE ARCHITECTURE
- 02.01 FRAMES & POSES
- 02.02 JOINT AXES
- 02.03 FORWARD & INVERSE KINEMATICS
- 02.06 KINEMATICS GATE
- 03.03 GEAR RATIO TRADE-OFFS
- 03.05 POWER & THERMAL LIMITS
- 04.01 CENTER OF MASS & SUPPORT
- 04.06 LOCOMOTION GATE
- 05.01 SENSE THE BODY
- 05.06 PERCEPTION GATE
- 06.01 FEEDBACK & ERROR
- 06.05 WATCHDOGS & AI AUTHORITY
- 07.05 DOCKING, DERATING & SEALING
- 08.01 GRASP & FRICTION
- 10.04 REQUIREMENTS & RFIs

## Important scanner false positives

### 02.06 — “NO SOLUTION”
The coarse numerical sampler did not land inside the narrow IK target tolerance. The browser end-to-end solver already completes these cases. This is not a mission blocker.

### 08.01 — “NO SOLUTION”
The wet-object safe grip window is narrow and fell between coarse sample points. Chromium regression finds and validates it. The physical slip/crush window is pedagogically sound.

### 09.05 — “NO SOLUTION”
The finite-budget transfer has feasible states (for example, high cyber coverage plus balanced requirement/fault coverage). The coarse grid missed the narrow budget/evidence intersection.

### Red world evidence is not always a player failure
06.05 correctly allows completion while WATCHDOG MARGIN and SAFE PROPOSAL are red after the AI command becomes stale, because recognizing that unsafe evidence and selecting FALLBACK is the lesson. Similar degraded-world cases require semantic labeling rather than blindly forcing every metric green.

## Systemic repair themes

### 1. Preserve useful performance
The biggest remaining structural defect is the ability to solve engineering constraints by doing less: zero acceleration, minimum torque, minimum loop rate, minimum speed. Every such mission needs an imposed useful task/output floor.

### 2. Make better hardware cost something
Voltage, capacity, cooling, clearance and reliability cannot be free upgrades. Use mass, cost, volume, compute, power or shared architecture budgets when the player is sizing hardware.

### 3. Separate “world is bad” from “player solution is bad”
A red metric currently always looks like failure. Some missions intentionally expose bad evidence and ask for a safe decision. The UI needs phase-aware metric semantics: `TARGET`, `DEGRADED / ACCEPTED`, `WORLD FAULT`, or `N/A FOR CURRENT OBJECTIVE`.

### 4. Gate missions must inherit the trade-offs learned earlier
Several `.06` Gates simplify their Act back into one-direction threshold checks. A Gate should reuse the repaired constraints, budgets and useful-performance floors from the preceding missions.

## Recommended repair order

1. **Functional-output cheese:** 03.01 → 03.04 → 04.04 → 05.05 → 06.04.
2. **Architecture-sizing cheese:** 07.02 → 07.04 → 08.02.
3. **Gate inheritance:** 03.06 → 06.06 → 07.06 → 09.06.
4. **Metric/goal alignment sweep:** all 21 MINOR items, preferably with phase-aware metric status in the shared engine instead of per-mission cosmetic patches.
5. Re-run Chromium regression + QA4 guard + QA5 scanner, then do a human rhythm/game-feel pass.

## Conclusion

The campaign has **no new technical blocker**, but the remaining full-campaign pedagogy audit shows that the representative QA4 sample was not an isolated issue. Twelve missions still need genuine redesign to prevent “make the task easier / make the hardware bigger” from replacing engineering reasoning.

The good news is that the defects cluster into a few reusable fixes: useful-performance floors, finite architecture budgets, phase-aware metric semantics, and stronger Gate inheritance. These should be repaired systemically before the final human full-campaign playtest.
