# Manual Testing Guide

Guide for testing Media Hero Catch with real Instagram and websites.

---

## Prerequisites

- Extension installed in Firefox
- Logged into Instagram account
- Internet connection

---

## Test Scenarios

### 1. Instagram Single Image Post

**Setup**:
1. Find any public Instagram post with single image
2. Example: `https://www.instagram.com/p/[POST_ID]/`

**Steps**:
1. Open extension popup
2. Paste Instagram URL
3. Click "Process All"

**Expected Results**:
- ✅ Tab opens in background
- ✅ Progress shows "1/1"
- ✅ Status changes to "Processing" → "Success"
- ✅ 1 file downloaded notification
- ✅ Image file in ~/Downloads folder
- ✅ Original filename preserved

**Common Issues**:
- Not logged in → Shows login required
- Private account → Access denied
- Invalid URL → Shows error

---

### 2. Instagram Carousel

**Setup**:
1. Find Instagram post with multiple images/videos
2. Look for posts with arrow indicators

**Steps**:
1. Paste carousel URL
2. Click "Process All"

**Expected Results**:
- ✅ All carousel items detected
- ✅ Files numbered: `image_1.jpg`, `image_2.jpg`, etc.
- ✅ All files downloaded
- ✅ Notification shows correct count

**Verify**:
- Check Downloads folder
- Count files matches carousel item count
- Files are in order

---

### 3. Instagram Video/Reel

**Setup**:
1. Find video post or reel
2. URL contains `/reel/` or post has video

**Steps**:
1. Paste video URL
2. Process

**Expected Results**:
- ✅ Video file downloads (.mp4)
- ✅ Original quality preserved
- ✅ File size appropriate

---

### 4. Generic Website Hero Image

**Setup**:
1. Find news article with large header image
2. Examples: NYTimes, BBC, CNN

**Steps**:
1. Copy article URL
2. Process in extension

**Expected Results**:
- ✅ Largest image detected
- ✅ Ignores small icons/logos
- ✅ Ignores ads
- ✅ Downloads main article image

---

### 5. Batch Processing (Multiple URLs)

**Setup**:
Collect 3-5 different URLs:
- 2 Instagram posts
- 1 Instagram carousel
- 2 news articles

**Steps**:
1. Paste all URLs (one per line)
2. Set delay to 3 seconds
3. Click "Process All"

**Expected Results**:
- ✅ URLs process sequentially
- ✅ 3-second pause between each
- ✅ Progress updates correctly
- ✅ All files download
- ✅ Final notification shows totals

**Timing Check**:
- With 5 URLs and 3s delay
- Should take ~15+ seconds total

---

### 6. Error Scenarios

#### Invalid URL

**Steps**:
1. Enter `not-a-url`
2. Process

**Expected**:
- ❌ Error message
- ❌ No processing starts

#### Non-existent Instagram Post

**Steps**:
1. Use URL: `https://www.instagram.com/p/INVALID123/`
2. Process

**Expected**:
- ⚠️ Shows as failed
- ⚠️ Continues if in batch

#### Login Required

**Steps**:
1. Log out of Instagram
2. Try to process post

**Expected**:
- ⚠️ Login wall detected
- ⚠️ Error message shown

---

## Verification Checklist

### Downloads Folder

After each test, check:
- [ ] Files exist in ~/Downloads
- [ ] Filenames are correct
- [ ] No corrupted files
- [ ] File sizes reasonable
- [ ] Can open files without errors

### Extension UI

- [ ] Progress bar updates smoothly
- [ ] URLs show correct status icons
- [ ] Success/failure counts accurate
- [ ] Download counts shown
- [ ] No UI glitches

### Browser Console

Check for errors:
1. F12 to open DevTools
2. Go to Console tab
3. Should see:
   - "Content script loaded" messages
   - Detection logs
   - No red errors

### Background Script Console

1. Go to `about:debugging`
2. Find extension
3. Click "Inspect"
4. Check console for:
   - Processing logs
   - Download events
   - No errors

---

## Performance Testing

### Large Batch Test

**Setup**: 10+ URLs

**Monitor**:
- Memory usage (shouldn't grow excessively)
- CPU usage (should be reasonable)
- Tab count (old tabs close properly)
- Download speed

**Abort Test**: Try canceling mid-batch
- Extension should handle gracefully

---

## Edge Cases

### 1. Very Large Carousel
- Find post with 10 images
- Verify all download
- Check numbering correct

### 2. Mixed Media Carousel
- Carousel with images + videos
- Both types should download
- Proper file extensions

### 3. High-Resolution Images
- Posts with 4K images
- Should download full quality
- File sizes 5-20MB

### 4. Slow Network
- Throttle network in DevTools
- Downloads should retry
- Eventually succeed or fail gracefully

---

## Browser Compatibility

### Firefox Versions

Test on:
- [ ] Firefox 115 (minimum)
- [ ] Firefox ESR
- [ ] Firefox Beta
- [ ] Firefox Nightly

### Different OS

If possible, test on:
- [ ] Windows
- [ ] macOS
- [ ] Linux (Ubuntu/Fedora)

---

## Known Limitations

**Won't Work**:
- Private Instagram accounts (unless you follow them)
- Stories (expire quickly)
- Live videos (streaming)
- Login-walled content
- CAPTCHA-protected pages

**May Have Issues**:
- Very slow networks (timeouts)
- Instagram rate limiting (too many requests)
- Dynamic content (heavy JavaScript sites)
- Cloudflare protected sites

---

## Reporting Issues

When reporting bugs, include:

1. **Environment**:
   - Firefox version
   - Extension version
   - Operating system

2. **Steps to Reproduce**:
   - Exact URL used (if not private)
   - Actions taken
   - Settings used (delay, etc.)

3. **Expected vs Actual**:
   - What should happen
   - What actually happened

4. **Console Logs**:
   - Browser console errors
   - Background script logs

5. **Screenshots**:
   - Extension UI state
   - Error messages

---

## Test Results Template

```markdown
## Test Run: [Date]

**Tester**: [Name]
**Extension Version**: 1.0.0
**Firefox Version**: 120.0
**OS**: macOS 14.0

### Test Results

| Test Case | Result | Notes |
|-----------|--------|-------|
| Instagram Single Image | ✅ Pass | - |
| Instagram Carousel | ✅ Pass | 5 items downloaded |
| Instagram Video | ✅ Pass | - |
| Generic Website | ✅ Pass | - |
| Batch Processing | ✅ Pass | 5 URLs, 15s total |
| Error Handling | ✅ Pass | Invalid URL rejected |

### Issues Found

1. [Issue description]
2. [Issue description]

### Overall Assessment

[Summary of test session]
```

---

## Best Testing Practices

1. **Test with Real Data**
   - Use actual Instagram posts
   - Test on real websites
   - Don't rely only on fixtures

2. **Test Regularly**
   - Instagram changes HTML frequently
   - Test after each update
   - Monitor for breakage

3. **Test Edge Cases**
   - Large carousels
   - Slow networks
   - Many concurrent batches

4. **Document Findings**
   - Note any quirks
   - Record performance issues
   - Track Instagram changes

---

**Manual testing is essential!** Automated tests can't catch everything. 🔍