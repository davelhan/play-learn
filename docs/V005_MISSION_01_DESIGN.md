# PLAY//LEARN V005 — MISSION 01 DESIGN

## Mission
**RBT-01 — KNOW WHICH WAY IS UP**

The purpose of this mission is to prove the complete PLAY//LEARN pedagogy inside one playable web mission.

## Learning outcome
The player should leave able to explain, in plain language:

- an IMU is a measurement source, not “balance itself”;
- State Estimation turns measurements into a usable robot state;
- a healthy sensor is insufficient if its data path or timing is wrong;
- a healthy estimate is insufficient if control response is late;
- diagnosis should follow evidence through the system chain rather than blame the last familiar component.

## No-quiz rule
The mission contains no required multiple-choice questions.

The player learns through:
- dragging the robot,
- observing live signals,
- switching the IMU off/on,
- reconnecting the IMU to the estimator,
- changing sensor data age,
- running physical tests,
- diagnosing a second downstream timing fault.

## Phase structure

### 0 — Hook
Run the broken robot.
Motors are known healthy.
Orientation is unavailable.

### 1 — Discover
Drag the torso left/right.
Actual angle and IMU raw angle change.
Estimated angle remains unknown.

### 2 — Manipulate
Turn IMU off and on.
The physical body angle still exists; the sensor measurement disappears.
This isolates “world state” from “measurement”.

### 3 — Connect
Repair the broken IMU → State Estimator path by dragging a connector.
The estimator now receives data, but it is stale.

### 4 — Cause / Effect + Name It
Reduce sensor-data age.
The estimated angle begins following actual angle more faithfully.
Only now reveal the term **State Estimation**.

### 5 — Guided test
Pass the 30-second standing test with:
- IMU online,
- IMU → estimator connected,
- sensor age <= 30 ms,
- control latency <= 35 ms.

### 6 — Transfer
Inject a different fault:
- orientation estimate remains healthy,
- control latency becomes 68 ms.

The player should not touch the IMU again.
They inspect downstream evidence and repair control timing.

### 7 — Complete
Persistent robot unlock:
**Orientation Stack**

Mastery:
- IMU — Explored
- State Estimation — Applied
- Control — Seen

## Memory Engine seed
The IMU should return later in:
- turning,
- vibration,
- estimator disagreement,
- sensor synchronization,
- a false-lead diagnosis where the IMU is healthy.

## Simulation disclaimer
All values are fictional training values. They communicate engineering relationships and do not represent Dyno specifications or predicted performance.
