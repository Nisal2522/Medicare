# MediSmart Event-Driven Architecture

## Why Database-Per-Service

Each backend service uses its own MongoDB database name (`medismart_*`) so data ownership is explicit and failures are isolated. A service can evolve its schema without forcing coordinated migrations across unrelated services.

## Why RabbitMQ Events

Services communicate with domain events (`UserRegistered.v1`, `PaymentSucceeded.v1`, `PaymentFailed.v1`) instead of direct service-to-service write calls. This reduces runtime coupling and supports eventual consistency with retry-safe consumers.

## Orchestration Boundary

`api-gateway` is the read orchestration layer. It aggregates data across services (for example booking summary data from appointment-service and doctor-service) while write authority remains in the domain service that owns the data.

## Saga Basics (Payment -> Appointment)

The payment flow uses event choreography:

1. `payment-service` publishes payment success/failure events.
2. `appointment-service` consumes the events and updates appointment state.
3. Repeated payment failures trigger compensation by cancelling the appointment and releasing the slot.

This avoids distributed ACID transactions while keeping cross-service state convergent over time.

