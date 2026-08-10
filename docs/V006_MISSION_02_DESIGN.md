# PLAY//LEARN V006 — MISSION 02 DESIGN

## RBT-02 — STEP WHERE YOU'RE GOING

### Product purpose
Prove the Memory Engine immediately after Mission 01.

The player has just learned:
- IMU
- State Estimation
- Control

Mission 02 deliberately starts with all three systems healthy.
The failure is elsewhere.

This prevents the player from learning a bad reflex:
“robot falls = IMU problem”.

## New learning
- Center of Mass
- Support Area
- Foot Placement
- Dynamic Recovery

## Interaction grammar
No mandatory multiple-choice questions.

The player:
1. runs a failed walk;
2. confirms state estimation is healthy;
3. shifts body lean and watches CoM projection move;
4. drags the swing foot to create a new support location;
5. changes forward speed and watches the recovery zone move;
6. receives the vocabulary after observing the behavior;
7. passes a 10-meter guided walk;
8. receives an offset payload;
9. adapts body / step placement while sensing remains healthy;
10. completes the mission.

## Memory Engine
Reused:
- IMU: healthy
- State Estimation: healthy, 96% confidence
- Control: healthy

This is a deliberate false-lead suppression pattern.

## Simplified simulation
The recovery zone is a fictional pedagogical abstraction inspired by dynamic balance / capture behavior.

It is not a robotics validation model and must never be represented as predicting any commercial robot’s real performance.

## Persistent unlock
**DYNAMIC BALANCE BASICS**

Mastery update:
- State Estimation — Reinforced
- Center of Mass — Applied
- Foot Placement — Explored
