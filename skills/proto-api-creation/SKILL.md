---
name: proto-api-creation
description: Guide for creating APIs and Protos following project conventions. Use this skill when the user asks to create, update, or structure APIs and .proto files.
license: Proprietary
---

# Proto & API Creation Guide

This skill guides you through the creation of APIs and Protobuf definitions following the codebase's strict conventions.

## 1. Proto & API Creation

When creating APIs, refer to the following `.proto` files for structure and conventions:

- [annual_event_2nd_guest_leaderboard_2025.proto](act/annual-event-2025-2nd/src/service/annual_event_2nd_guest_leaderboard_2025.proto)
- [champagne_festival_2025.proto](act/annual-event-2025-2nd/src/service/champagne_festival_2025.proto)
- [annual_recharge_2025.proto](act/annual-event-2025-2nd/src/service/annual_recharge_2025.proto)
- [foodie_order_battle_2026.proto](act/foodie-order-battle-2026/src/service/foodie_order_battle_2026.proto)
- [pajama-party-2025.proto](act/pajama-party-2025/src/service/pajama-party-2025.proto)

**Crucial Reminder:** Always remember to update `activity_id` in the relevant configuration/service files when setting up new events.

## 2. Activity Configuration

- **Activity ID:** Ensure `activity_id` is updated and correct for the specific event being developed.
