# Accessibility Testing Guide - Sidebar Premium

## Quick Testing Guide

This guide helps you verify all accessibility features are working correctly.

## 1. Keyboard Navigation Testing

### Basic Navigation
1. **Open the application** in your browser
2. **Press Tab** repeatedly to navigate through elements
3. **Verify** you can reach:
   - Skip link (appears at top on first Tab)
   - Clock section
   - Profile card
   - System status indicators
   - Section headers
   - Action buttons
   - Metric cards
   - Quest items
   - All other interactive elements

### Section Toggle
1. **Tab to a section header** (e.g., "Actions Rapides")
2. **Press Enter** or **Space** to toggle
3. **Verify** the section expands/collapses
4. **Check** the arrow icon rotates

### Button Activation
1. **Tab to an action button** (e.g., "Focus")
2. **Press Enter** or **Space**
3. **Verify** the button responds (visual feedback)

### Expected Tab Order
```
Skip Link → Clock → Profile Card → Status Grid → 
Section 1 Header → (if expanded) Section 1 Content → 
Section 2 Header → (if expanded) Section 2 Content → 
... and so on
```

## 2. Focus Indicator Testing

### Visual Verification
1. **Tab through elements** and observe focus indicators
2. **Check for:**
   - ✅ Cyan outline (3px width)
   - ✅ Glow effect around focused element
   - ✅ Clear separation from element
   - ✅ Visible against dark background
   - ✅ No overlap with content

### Focus Styles by Element Type

**Buttons:**
- Cyan outline with glow
- Slightly elevated appearance

**Section Headers:**
- Cyan outline
- Background highlight

**Cards:**
- Cyan outline
- Shadow effect

**Profile Card:**
- Prominent cyan outline
- Enhanced glow

## 3. Screen Reader Testing

### NVDA (Windows)
1. **Start NVDA** (Insert + N)
2. **Navigate to sidebar** (Tab or arrow keys)
3. **Listen for announcements:**
   - "Sidebar Premium QuietQuest, complementary"
   - "Actions Rapides, button, collapsed" (or expanded)
   - "Démarrer une session focus, button"
   - "XP Total: 12,450 points, button"
   - "Système actif, status"

### VoiceOver (Mac)
1. **Enable VoiceOver** (Cmd + F5)
2. **Navigate with VO keys** (Control + Option + arrows)
3. **Verify announcements** match expected labels

### JAWS (Windows)
1. **Start JAWS**
2. **Navigate sidebar** with Tab or arrow keys
3. **Verify** proper role and state announcements

### Expected Announcements

| Element | Expected Announcement |
|---------|----------------------|
| Sidebar | "Sidebar Premium QuietQuest, complementary" |
| Section Header | "Actions Rapides, button, collapsed" |
| Action Button | "Démarrer une session focus, button" |
| Metric Card | "XP Total: 12,450 points, button" |
| Status | "Système actif, status" |
| Progress Bar | "Progression: 75 pourcent, progress bar, 75%" |
| Quest Item | "Quête: Lire 30 minutes, progression 75 pourcent, button" |

## 4. Color Contrast Testing

### Manual Verification
1. **Open browser DevTools**
2. **Inspect text elements**
3. **Check contrast ratios:**
   - Primary text: Should be ~12:1 or higher
   - Secondary text: Should be ~14:1 or higher
   - Minimum acceptable: 4.5:1

### Using Browser Tools

**Chrome DevTools:**
1. Right-click element → Inspect
2. Look for contrast ratio in Styles panel
3. Verify green checkmark (passes WCAG AA)

**Firefox DevTools:**
1. Right-click element → Inspect
2. Check Accessibility panel
3. View contrast ratio information

### Elements to Check
- ✅ Section titles
- ✅ Button labels
- ✅ Metric values
- ✅ Status labels
- ✅ Quest titles
- ✅ Progress percentages

## 5. Reduced Motion Testing

### Enable Reduced Motion

**Windows:**
1. Settings → Accessibility → Visual effects
2. Turn off "Show animations in Windows"

**Mac:**
1. System Preferences → Accessibility → Display
2. Check "Reduce motion"

**Browser (Chrome/Edge):**
1. DevTools → Rendering tab
2. Check "Emulate CSS media feature prefers-reduced-motion: reduce"

### Verify Disabled Animations
1. **Profile Card:** No 3D tilt on hover
2. **Status Pulse:** No pulsing animation
3. **Badges:** No pulse effect
4. **Progress Bars:** Instant fill (no transition)
5. **Hover Effects:** No lift animations
6. **Section Toggle:** Instant expand/collapse

### What Should Still Work
- ✅ All functionality remains
- ✅ Hover states still visible
- ✅ Focus indicators still appear
- ✅ Content still accessible
- ✅ No jarring movements

## 6. High Contrast Mode Testing

### Enable High Contrast

**Windows:**
1. Settings → Accessibility → Contrast themes
2. Select a high contrast theme

**Browser:**
1. DevTools → Rendering
2. Emulate "prefers-contrast: high"

### Verify Enhancements
- ✅ Borders are thicker (2px)
- ✅ Focus outlines are wider (4px)
- ✅ Colors remain distinguishable
- ✅ Text is clearly readable

## 7. Mobile/Touch Testing

### Responsive Behavior
1. **Resize browser** to < 1024px width
2. **Verify** sidebar hides automatically
3. **Check** mobile toggle button appears
4. **Test** overlay functionality

### Touch Targets
- All buttons should be at least 44x44px
- Adequate spacing between interactive elements
- No accidental activations

## Common Issues and Solutions

### Issue: Focus indicator not visible
**Solution:** Check browser zoom level, ensure CSS is loaded

### Issue: Screen reader not announcing
**Solution:** Verify ARIA attributes, check element roles

### Issue: Keyboard navigation skips elements
**Solution:** Check tabIndex values, ensure elements are focusable

### Issue: Animations still playing with reduced motion
**Solution:** Clear browser cache, verify media query

### Issue: Low contrast warnings
**Solution:** Check color values, verify opacity settings

## Automated Testing Tools

### Browser Extensions
- **axe DevTools** (Chrome/Firefox)
- **WAVE** (Chrome/Firefox)
- **Lighthouse** (Chrome DevTools)

### Running Lighthouse
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"
5. **Target Score:** 100/100

### Expected Lighthouse Results
- ✅ All elements have accessible names
- ✅ Background and foreground colors have sufficient contrast
- ✅ Elements use allowed ARIA attributes
- ✅ ARIA attributes have valid values
- ✅ Elements with ARIA roles have required attributes
- ✅ Interactive elements are keyboard focusable

## Checklist for Complete Testing

### Keyboard Navigation
- [ ] Can tab to all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Section headers toggle with keyboard
- [ ] Skip link works
- [ ] Tab order is logical
- [ ] No keyboard traps

### Focus Indicators
- [ ] Visible on all elements
- [ ] High contrast (cyan on dark)
- [ ] 3px minimum width
- [ ] Clear separation from content
- [ ] Works in all themes

### Screen Reader
- [ ] Sidebar role announced
- [ ] Section states announced
- [ ] Button purposes clear
- [ ] Progress values announced
- [ ] Decorative icons hidden

### Color Contrast
- [ ] All text meets 4.5:1 ratio
- [ ] Borders are visible
- [ ] Focus indicators have contrast
- [ ] Works in high contrast mode

### Reduced Motion
- [ ] Animations disabled
- [ ] 3D effects removed
- [ ] Pulse animations stopped
- [ ] Transitions eliminated
- [ ] Functionality preserved

### ARIA Attributes
- [ ] Proper roles assigned
- [ ] Labels are descriptive
- [ ] States are announced
- [ ] Values are accurate
- [ ] Groups are labeled

## Reporting Issues

If you find accessibility issues:

1. **Document the issue:**
   - What element is affected
   - What behavior is expected
   - What behavior is observed
   - Steps to reproduce

2. **Include context:**
   - Browser and version
   - Operating system
   - Assistive technology used
   - Screen size/zoom level

3. **Provide evidence:**
   - Screenshots
   - Screen recordings
   - Console errors
   - DevTools output

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

---

**Last Updated:** December 8, 2025  
**Version:** 1.0  
**Status:** Complete
