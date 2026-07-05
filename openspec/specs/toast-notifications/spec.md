# Toast Notifications Specification

## Purpose

The toast notifications domain provides lightweight, non-blocking feedback for user actions. Toasts display success, error, and info messages stacked from the top-right corner with automatic dismissal and CSS-only animations.

## Requirements

### Requirement: TNR-REQ-1 — Toast Context Provider

The system MUST provide a React context (`ToastContext`) that exposes `toast.success(msg)`, `toast.error(msg)`, and `toast.info(msg)` methods. The provider MUST manage a toast queue and MUST be rendered in the root `Layout` component.

#### Scenario: Success toast

- GIVEN a user action completes successfully
- WHEN `toast.success("Bean created")` is called
- THEN a green-tinted toast with a checkmark icon appears at the top-right for ~3.5s

#### Scenario: Error toast

- GIVEN an API request fails
- WHEN `toast.error("Failed to save")` is called
- THEN a red-tinted toast with an X icon appears at the top-right for ~3.5s

#### Scenario: Info toast

- GIVEN a non-critical event occurs
- WHEN `toast.info("Session expires in 5 min")` is called
- THEN a blue-tinted toast with an info circle icon appears at the top-right for ~3.5s

### Requirement: TNR-REQ-2 — Auto-Dismiss with CSS Animation

Toasts MUST auto-dismiss after approximately 3.5 seconds. Enter/exit animations MUST be CSS-only (`@keyframes`): slide-in from right over 250ms, slide-out to right with fade over 200ms.

#### Scenario: Toast enters and exits

- GIVEN a toast is triggered
- WHEN it renders
- THEN it slides in from the right over 250ms
- AND after ~3.5s it slides out to the right with fading over 200ms
- AND it is removed from the DOM after the exit animation completes

### Requirement: TNR-REQ-3 — Stacked Display

Toasts MUST stack vertically from the top-right corner, newest on top, with 8px gap. The toast container MUST be position-fixed with a `z-index` above all other UI layers (minimum `z-50`).

#### Scenario: Multiple toasts stack

- GIVEN 3 toasts fire in quick succession
- WHEN they render
- THEN they stack vertically from top-right with 8px gap, newest at the top
