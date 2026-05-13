---
name: component-creation
description: Guide for creating UI components, modals, and pages, optionally from image and description inputs. Use this skill when the user wants to build UI elements or provides a visual design/description to implement.
license: Proprietary
---

# Component Creation Guide

This skill guides you through creating UI components, modals, and pages, ensuring they adhere to the project's design and coding standards. You can use this skill to generate code from image inputs (screenshots, mockups) and text descriptions.

## 1. Input Processing (Image & Description)

When provided with an image or description of a UI component:

1.  **Analyze the Visuals:** Identify layout, colors, typography, and interactive elements.
2.  **Map to Conventions:** Match the observed elements to existing common components (e.g., `DisplayImg`, `SectionContainer`) and styling patterns (UnoCSS).
3.  **Check Constraints:** Ensure text truncation (`truncate`, `max-w`) is applied to dynamic content as per "General Coding Standards".

## 2. Leaderboard Implementation

For leaderboard functionality, refer to these examples:

- **Complex/Guest Leaderboard:**
  - [Home.tsx](act/annual-event-2025-2nd/src/pages/GuestLeaderboard/Home/Home.tsx)
  - [LeaderboardPage.tsx](act/annual-event-2025-2nd/src/pages/RoomLeaderboard/LeaderboardPage.tsx)
- **Simple Leaderboard:**
  - [LeaderboardTab.tsx (Foodie)](act/foodie-order-battle-2026/src/pages/Home/LeaderboardTab/LeaderboardTab.tsx)
  - [LeaderboardTab.tsx (Dreamy)](act/dreamy-fairyland-2025/src/pages/Home/LeaderboardTab/LeaderboardTab.tsx)

## 3. Modals

### Rewards Modal

Refer to:

- [LeaderboardRewardsModal.tsx](act/dreamy-fairyland-2025/src/pages/Home/LeaderboardTab/LeaderboardRewardsModal/LeaderboardRewardsModal.tsx)
- [CongratulateGiftModal.tsx](act/dreamy-fairyland-2025/src/pages/Home/PrizePoolTab/CongratulateGiftModal/CongratulateGiftModal.tsx)

### Records Modal

Refer to:

- [FragmentAcquisitionRecordsModal.tsx](act/dreamy-fairyland-2025/src/pages/Home/PrizePoolTab/FragmentAcquisitionRecordsModal/FragmentAcquisitionRecordsModal.tsx)
- [FragmentGiftRedemptionRecordsModal.tsx](act/dreamy-fairyland-2025/src/pages/Home/PrizePoolTab/FragmentGiftRedemptionRecordsModal/FragmentGiftRedemptionRecordsModal.tsx)

### Event State Blocking Modal

Refer to:

- [EventStateBlockingModal.tsx](act/gift-treasure-card-shop-2025/src/pages/EventStateBlockingModal/EventStateBlockingModal.tsx)

## 4. Rule Page

- **Start & End Time:** Always use the times from the **Home Info API** (available in every project).
- **Navigation:** Do NOT pass the `more` parameter to the `Navigation` component. Rule pages are static and do not need a refresh button.
- **Reference:** [Rule.tsx](act/valentine-love-song-2026/src/pages/Rule/Rule.tsx)

## 5. Components & UI

### Progress Bar

- **With Milestone:** [ProgressLine.tsx (Annual)](act/annual-event-2025-2nd/src/components/ProgressLine/ProgressLine.tsx)
- **Simple (Without Milestone):** [ProgressLine.tsx (Dreamy)](act/dreamy-fairyland-2025/src/components/ProgressLine/ProgressLine.tsx)

### Tabs Creation

Refer to:

- [Tabs.tsx](act/valentine-love-song-2026/src/pages/Home/Tabs/Tabs.tsx)

### Reward Component

Refer to:

- [EventRewardSection.tsx](act/valentine-love-song-2026/src/pages/Home/VoucherTab/EventRewardSection/EventRewardSection.tsx) (Lines 14-33)
- **Requirements:**
  - Must include `tag`, `name`, and `description`.
  - **Crucial:** Always add `max-w` and `truncate` to prevent overflow on user names and reward names.

### SVGA Animation

Refer to:

- [useCapsuleScreenAnimation.ts](act/valentine-love-song-2026/src/hooks/useCapsuleScreenAnimation.ts)

## 6. General Coding Standards (UI Related)

### Styling & CSS

- **UnoCSS:** Use UnoCSS for all styling needs except for image imports.
- **Units:** Use `px` units directly in code. PostCSS is configured to handle the conversion automatically.
- **Images & Animations Separation:** For component visuals like tabs/buttons/cards, keep images, decorative layers, and animations entirely in `.scoped.scss` (including pseudo-elements and `@keyframes`). `tsx` should only handle structure, data rendering, and interactions.

### String Formatting & Concatenation

- **Simple Strings:** Use the `.format()` extension: `{"{0} text".format(variable)}`.
  - **Example:** `{'每日排行榜前{0}名用户可瓜分{1}钻石'.format(topXWinner, sharedDiamonds)}`
  - **NEVER use template literals inside JSX text:** ❌ `<p>总榜Top1-{data?.data?.topXWinner}用户获得奖励</p>`
  - **ALWAYS use .format():** ✅ `<p>{'总榜Top1-{0}用户获得奖励'.format(`${data?.data?.topXWinner}`)}</p>`
- **JSX Concatenation:** Use `replaceJSX` when including JSX components within strings: `{"{0} text".replaceJSX('{0}', <span className="text-bold">Value</span>)}`.
- **References:**
  - [Rule.tsx](act/valentine-love-song-2026/src/pages/Rule/Rule.tsx) (for `.format()`)
  - [ConfirmPurchaseModal.tsx](act/ancient-capital-adventure-2025/src/components/ConfirmPurchaseModal/ConfirmPurchaseModal.tsx) (for `replaceJSX`)

### Text Overflow

- **Text Overflow:** Always perform max length checks on dynamic text (user names, reward names). Use CSS truncation (`truncate`, `max-w-*`) to handle overflows gracefully.

## 7. Common Components

Reuse these components to maintain consistency and efficiency:

### DisplayImg

Handles image display with WebP fallback support.

- **Reference:** [DisplayImg.tsx](act/valentine-love-song-2026/src/components/DisplayImg/DisplayImg.tsx)

### SectionContainer

Standard layout container with Top, Middle, and Bottom sections.

- **Reference:** [SectionContainer.tsx](act/valentine-love-song-2026/src/components/SectionContainer/SectionContainer.tsx)

### SingleAutoscrollText

Displays text that auto-scrolls (marquee) if it overflows the container width.

- **Reference:** [SingleAutoscrollText.tsx](act/valentine-love-song-2026/src/components/SingleAutoscrollText/SingleAutoscrollText.tsx)
