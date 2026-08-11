# PLAY//LEARN — Robotics Campaign QA3

**Scope:** 60 canonical missions · 10 Acts · review date 2026-08-11

## QA3 rubric

Each mission is reviewed on four independent axes:

- **Interaction** — controls behave correctly and the player must act rather than merely read/click an answer.
- **Pedagogy** — gameplay demonstrates the intended mental model and cannot be passed by learning the wrong lesson.
- **UX** — state, authority, evidence, affordances and feedback are understandable at normal desktop scale.
- **Rhythm** — pacing, repetition, consolidation and transfer feel appropriate rather than rushed or mechanical.

Verdicts: **PASS** = keep; **MINOR** = polish; **REWORK** = concept/mechanic needs redesign; **BLOCKER** = do not consider pedagogically releasable.

## Executive result

**22 PASS · 11 MINOR · 25 REWORK · 2 BLOCKER**

The campaign is technically functional, but QA3 rejects the idea that “60 playable missions” means “60 finished learning missions.” The strongest material is the custom chain and the batch missions where the world imposes a condition and the player makes a concrete engineering decision. The weakest material is where independent sliders can simply be maximized/minimized, or where a Gate does not actually test the Act it claims to close.

## Browser interaction result

- **60/60 mission routes PASS** the Chromium interaction sweep.
- **51/51 shared-engine missions** complete their automated Explore/Apply/Transfer or Gate path without soft-lock.
- **9/9 custom missions (01.01→02.03) PASS end-to-end** through their bespoke interactions and completion flags.
- Enabled range controls are tested with native mouse **click-hold-drag**, input-event verification and DOM-node continuity during drag.
- The QA3 pass found and corrected 06.01: the delay disturbance is now strong enough to invalidate the nominal tune and require a real retune rather than an artificial “change something” step.

**Important:** browser PASS means runtime/interaction correctness. It does not override a pedagogical REWORK or BLOCKER below.

## Mission-by-mission audit

| Mission | Title | Interaction | Pedagogy | UX | Rhythm | Verdict | Main action |
|---|---|---|---|---|---|---|---|
| 01.01 | SYSTEM LAYERS | PASS | PASS | PASS | MINOR | MINOR | Slow the final consolidation; the pedagogical placeholder is already solid. |
| 01.02 | COMMANDS DOWN, EVIDENCE UP | MINOR | PASS | PASS | MINOR | MINOR | Reduce repetitive pulses and make the final replan more manual. |
| 01.03 | TRACE THE BROKEN LAYER | PASS | PASS | MINOR | PASS | MINOR | Neutralize mismatch styling slightly so the guided UI does not reveal the answer too early. |
| 01.04 | BUILD THE ARCHITECTURE | REWORK | REWORK | PASS | PASS | REWORK | Let incorrect architectures run and fail instead of rejecting wrong placements immediately. |
| 01.05 | COUPLED FAILURE | REWORK | REWORK | MINOR | MINOR | Make coupled failure more physical/visible and requirement negotiation less answer-like. |
| 01.06 | ARCHITECTURE GATE | PASS | PASS | MINOR | MINOR | MINOR | Reduce scaffolding slightly while keeping the integrated Gate. |
| 02.01 | FRAMES & POSES | PASS | PASS | PASS | PASS | PASS | Keep. |
| 02.02 | JOINT AXES | PASS | PASS | PASS | PASS | PASS | Keep. |
| 02.03 | FORWARD & INVERSE KINEMATICS | PASS | PASS | PASS | PASS | PASS | Keep; only monitor target tolerance in human playtest. |
| 02.04 | WORKSPACE & REACH | REWORK | REWORK | PASS | PASS | REWORK | Replace scalar target radius with a real 2D workspace map and directional targets. |
| 02.05 | SINGULARITIES & COLLISION | MINOR | PASS | MINOR | PASS | MINOR | Add visible geometric collision rather than relying only on a clearance proxy. |
| 02.06 | KINEMATICS GATE | REWORK | REWORK | PASS | PASS | REWORK | Add a case where reference frame and joint axis are genuinely decisive. |
| 03.01 | TORQUE & INERTIA | PASS | PASS | PASS | PASS | PASS | Keep. |
| 03.02 | MOTOR VS TRANSMISSION | PASS | PASS | PASS | PASS | PASS | Keep. |
| 03.03 | GEAR RATIO TRADE-OFFS | MINOR | MINOR | PASS | PASS | MINOR | Make efficiency a component/technology choice with a consequence, not a free quality slider. |
| 03.04 | CONTINUOUS VS PEAK | MINOR | MINOR | PASS | PASS | MINOR | Show thermal accumulation/duty cycle more explicitly; Sustainable Index is too decorative. |
| 03.05 | POWER & THERMAL LIMITS | PASS | PASS | PASS | PASS | PASS | Keep. |
| 03.06 | ACTUATION GATE | REWORK | REWORK | PASS | PASS | REWORK | Add a real continuous/peak + duty/thermal case to the Gate. |
| 04.01 | CENTER OF MASS & SUPPORT | PASS | PASS | PASS | PASS | PASS | Keep. |
| 04.02 | CONTACT & FRICTION | REWORK | REWORK | PASS | PASS | REWORK | Constrain normal force by weight/load sharing; the player must not create arbitrary normal force. |
| 04.03 | FOOT PLACEMENT | PASS | PASS | PASS | PASS | PASS | Keep. |
| 04.04 | GAIT & WHOLE-BODY CONTROL | PASS | PASS | PASS | PASS | PASS | Keep. |
| 04.05 | RECOVERY & FALL MANAGEMENT | PASS | PASS | PASS | PASS | PASS | Keep; RECOVER vs CONTROLLED FALL is a strong concrete decision. |
| 04.06 | LOCOMOTION GATE | REWORK | REWORK | PASS | PASS | REWORK | Add obstacle/gait and a case outside the recovery envelope requiring controlled fall. |
| 05.01 | SENSE THE BODY | REWORK | REWORK | PASS | MINOR | REWORK | Add different failure modes so the sensing strategy depends on context; avoid FULL_FUSION as universal answer. |
| 05.02 | TIMING & CALIBRATION | PASS | PASS | PASS | PASS | PASS | Keep. |
| 05.03 | FUSE SENSORS | REWORK | REWORK | PASS | PASS | REWORK | Replace cancellation of known signed errors with uncertainty/variance weighting and source failure modes. |
| 05.04 | STATE ESTIMATION | REWORK | REWORK | MINOR | PASS | REWORK | Visualize prediction → measurement → innovation → covariance instead of abstract number tuning. |
| 05.05 | PERCEPTION UNDER UNCERTAINTY | PASS | PASS | PASS | PASS | PASS | Keep. |
| 05.06 | PERCEPTION GATE | REWORK | REWORK | PASS | PASS | REWORK | Add diagnosis of timing/fusion/state estimation, not only speed/clearance. |
| 06.01 | FEEDBACK & ERROR | PASS | PASS | PASS | PASS | PASS | QA3 disturbance corrected to 55 ms so the nominal tune genuinely loses margin and must be retuned. |
| 06.02 | PID & IMPEDANCE | REWORK | REWORK | PASS | PASS | REWORK | Rename to IMPEDANCE CONTROL or actually introduce P/I/D; current gameplay does not teach PID. |
| 06.03 | BANDWIDTH, LATENCY & SATURATION | MINOR | MINOR | PASS | PASS | MINOR | Couple command demand more strongly to motion frequency/amplitude so saturation is causal. |
| 06.04 | NESTED LOOPS & REAL TIME | REWORK | REWORK | PASS | PASS | REWORK | Add CPU/compute budget so “inner high / outer low” is not a trivial optimum. |
| 06.05 | WATCHDOGS & AI AUTHORITY | PASS | PASS | PASS | PASS | PASS | Keep. |
| 06.06 | CONTROL GATE | REWORK | REWORK | PASS | PASS | REWORK | Test impedance, saturation and nested loops in addition to tracking/delay/AI authority. |
| 07.01 | ENERGY VS POWER | REWORK | REWORK | PASS | PASS | REWORK | Make peak-power capability a real constraint/action that can fail despite sufficient energy. |
| 07.02 | BATTERY & BMS | PASS | PASS | PASS | PASS | PASS | Keep. |
| 07.03 | REGENERATION & POWER FLOW | PASS | PASS | PASS | PASS | PASS | Keep. |
| 07.04 | HEAT & COOLING | PASS | PASS | PASS | PASS | PASS | Keep. |
| 07.05 | DOCKING, DERATING & SEALING | PASS | PASS | PASS | PASS | PASS | Keep. |
| 07.06 | ENERGY GATE | REWORK | REWORK | PASS | PASS | REWORK | Add near-full regeneration and explicit RETURN/STOP/docking decision cases. |
| 08.01 | GRASP & FRICTION | MINOR | MINOR | PASS | PASS | MINOR | Add fragility/crush or a second object so the solution is not just “raise grip until margin.” |
| 08.02 | UNDERACTUATION & TACTILE | PASS | PASS | PASS | PASS | PASS | Keep. |
| 08.03 | FORCE CONTROL | REWORK | REWORK | PASS | PASS | REWORK | Add closed-loop force response and tangential motion freedom; current tuning is too static. |
| 08.04 | HANDOVER & HRI | PASS | PASS | PASS | PASS | PASS | Keep. |
| 08.05 | SERVICEABILITY & INDUSTRIAL DESIGN | REWORK | REWORK | PASS | PASS | REWORK | Couple package volume, venting, sealing, service access and swept volume into a real trade-off. |
| 08.06 | MANIPULATION GATE | REWORK | REWORK | PASS | PASS | REWORK | Add tactile/underactuation and industrial-design/service consequences. |
| 09.01 | HAZARDS & RISK | REWORK | REWORK | PASS | PASS | REWORK | Add budget/cost and distinct mitigations; otherwise every reduction should simply be maximized. |
| 09.02 | PROTECTIVE STOPS & STO | PASS | PASS | PASS | PASS | PASS | Keep. |
| 09.03 | FMEA & FTA | REWORK | REWORK | PASS | PASS | REWORK | Add an actual AND/OR fault tree or remove FTA from the mission title. |
| 09.04 | RELIABILITY & AVAILABILITY | REWORK | REWORK | PASS | PASS | REWORK | Add cost/service/spares trade-offs; max MTBF + min MTTR is otherwise monotonic. |
| 09.05 | V&V, FAULT INJECTION & CYBER | REWORK | REWORK | PASS | PASS | REWORK | Add limited test budget and representative/adversarial scenario selection. |
| 09.06 | SAFETY GATE | REWORK | REWORK | PASS | PASS | REWORK | Build a mini safety case including FMEA/FTA, reliability and cyber evidence. |
| 10.01 | EVIDENCE DISCIPLINE | PASS | PASS | PASS | PASS | PASS | Keep. |
| 10.02 | SYSTEM DESIGN REVIEW | MINOR | MINOR | PASS | PASS | MINOR | Add cost/time or an explicit RELEASE/HOLD decision to break monotonic optimization. |
| 10.03 | ZONE REVIEW | REWORK | REWORK | PASS | PASS | REWORK | Create one shared physical envelope where improving thermal/FOV/clearance can degrade another discipline. |
| 10.04 | REQUIREMENTS & RFIs | PASS | BLOCKER | PASS | PASS | BLOCKER | Nominal goal does not enforce DECISION STATE: PROCEED can pass while SAFE DECISION says HOLD. Enforce HOLD → clarify → PROCEED logic. |
| 10.05 | CHANGE IMPACT & TRACEABILITY | MINOR | MINOR | PASS | PASS | MINOR | Add retest budget/prioritization instead of simply maximizing two coverage values. |
| 10.06 | FINAL DESIGN REVIEW | PASS | BLOCKER | MINOR | REWORK | BLOCKER | Replace three abstract sliders with a genuine cross-domain defense of the accumulated humanoid design and evidence from previous Acts. |

## Systemic findings

### What is working

1. **WORLD / EVIDENCE vs YOUR CONTROLS** is the right systemic correction. Scenario facts are no longer disguised as player knobs.
2. The best batch missions make the learner choose an engineering response to an imposed fact: **04.05, 06.05, 07.05, 08.04, 10.01**.
3. Mission-specific causal visuals materially improve comprehension over a generic dashboard.
4. The browser interaction suite now protects shared slider behavior, fail→recover progression and bespoke custom journeys from regression.

### Main problems still present

1. **Monotonic slider problems masquerading as trade-offs.** If every useful variable should just go to maximum/minimum, the learner is tuning a dashboard rather than reasoning.
2. **Gate under-coverage.** Several `.06` missions close an Act without testing important concepts taught earlier in that Act.
3. **Concept/mechanic mismatch.** Key examples: 05.03 sensor fusion, 06.02 PID & Impedance, 09.03 FMEA & FTA.
4. **Batch rhythm repetition.** EXPLORE → APPLY → TRANSFER is a useful grammar, but 51 missions cannot all feel like the same three-stage control panel.
5. **Final capstone weakness.** 10.06 must defend the accumulated humanoid design, not optimize three abstract percentages.

## Repair order

1. **BLOCKERS:** 10.04, 10.06.
2. **Act Gates:** 02.06, 03.06, 04.06, 05.06, 06.06, 07.06, 08.06, 09.06.
3. **Concept/mechanic mismatches:** 05.01, 05.03, 05.04, 06.02, 07.01, 09.03.
4. **Monotonic / weak trade-offs:** 04.02, 08.05, 09.01, 09.04, 09.05, 10.03.
5. **MINOR polish:** pacing, visual evidence, reduced repetitive clicks, then final human playtest.

## Release interpretation

- **Runtime / browser interaction:** PASS.
- **Pedagogical release quality:** NOT PASS YET.
- The campaign should not be called final until the two BLOCKERS are removed and the REWORK set has been redesigned or consciously waived.
