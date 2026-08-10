# PLAY//LEARN — Mission 01 QA Report

## Reported symptom
After the initial failed standing test, the mission appears blocked and the UI does not make the next action clear.

## Root cause
The original implementation kept the phase on HOOK after the failed test and only enabled a generic CONTINUE button after 300 ms. The instruction still said “Run the failure”, so the screen provided contradictory state: the requested action had already been completed but the mission text did not update.

## Additional UX blockers found
1. Generic CONTINUE button used as hidden state-machine gate.
2. No explicit completion checklist for multi-action phases.
3. Robot tilt requires both left/right thresholds without showing either threshold as completed.
4. IMU OFF/ON requirement has no visible two-step progress.
5. Connector drag target is small and has no accessible fallback.
6. Sensor timing phase gives no explicit numerical target in the UI.
7. Transfer phase says the response is late but does not explicitly tell the player to adjust Control latency and rerun the test.
8. RUN TEST remains available in phases where it is not the required action, creating noise.

## Fixes implemented
- Event-driven phase progression; no generic CONTINUE gate.
- Initial failure automatically advances to DISCOVER.
- Permanent NEXT ACTION panel.
- Per-phase live checklist with completion marks.
- Active interaction receives a pulsing focus highlight.
- Test button disabled when testing is not the current task.
- Connector supports both drag-and-drop and click-plug → click-socket.
- Explicit targets: Sensor data age ≤ 30 ms; Control latency ≤ 35 ms.
- State Estimation concept reveal moved until after timing cause/effect is actually experienced.
- Guided test automatically injects the transfer fault after success.
- Transfer success automatically completes the mission.

## Expected golden path
START → RUN INITIAL TEST → drag torso left/right → IMU OFF/ONLINE → connect IMU to estimator → Sensor data age ≤30 ms → concept reveal → RUN STAND TEST → Control latency ≤35 ms → RUN STAND TEST → COMPLETE.
