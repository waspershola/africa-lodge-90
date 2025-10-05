# Sound Files Setup Guide

## 🎵 Required Sound Files

Your notification system needs three MP3 files in `public/sounds/`:

1. **`alert-high.mp3`** - Urgent notifications (guest requests, payments)
2. **`alert-medium.mp3`** - Standard notifications (check-in/out, updates)  
3. **`alert-critical.mp3`** - Emergency alerts (escalations, critical issues)

---

## 📥 How to Get Free Sound Files

### Option 1: Mixkit (Recommended - No Attribution Required)

**Best for hotel environments - professional quality**

1. Visit [Mixkit Free Sound Effects - Notifications](https://mixkit.co/free-sound-effects/notification/)
2. Browse and preview sounds
3. Download your choices directly (MP3 format)
4. Rename files to match the required names
5. Place in `public/sounds/` folder

**Recommended Sounds:**
- **Alert High**: "Digital bell notification" or "Clear announcement chime"
- **Alert Medium**: "Soft notification" or "Gentle interface sound"
- **Alert Critical**: "Alarm buzzer" or "Emergency notification"

---

### Option 2: Pixabay (Free for Commercial Use)

**Large selection with good variety**

1. Visit [Pixabay Sound Effects - Notification](https://pixabay.com/sound-effects/search/notification/)
2. Listen to preview and select appropriate sounds
3. Click Download (MP3 format available)
4. Rename and place in `public/sounds/` folder

**Search terms to try:**
- "notification bell"
- "soft chime"
- "alarm buzzer"
- "emergency alert"

---

### Option 3: Freesound.org (Community Library)

**Most variety but check licenses**

1. Visit [Freesound.org](https://freesound.org/)
2. Search for "notification" or "bell" or "alarm"
3. Filter by license: "Creative Commons 0" for no attribution required
4. Download and convert to MP3 if needed
5. Rename and place in `public/sounds/` folder

---

### Option 4: Generate Custom Sounds (Advanced)

Use online tone generators to create custom notification sounds:

1. **Beep Generator**: [onlinetonegenerator.com](https://onlinetonegenerator.com/)
2. **Audio Toolset**: [audiotoolset.com](https://audiotoolset.com/)

**Alert High Settings:**
- Frequency: 800-1200 Hz
- Duration: 2 seconds
- Waveform: Sine or triangle
- Volume: Medium-high

**Alert Medium Settings:**
- Frequency: 600-800 Hz
- Duration: 1 second
- Waveform: Sine
- Volume: Medium

**Alert Critical Settings:**
- Frequency: 400-600 Hz (lower = more urgent)
- Duration: 3-4 seconds
- Waveform: Square (harsher sound)
- Pattern: Repeating beeps
- Volume: High

---

## 🎚️ Sound Specifications

### Technical Requirements

| Sound Type | Duration | Format | Sample Rate | Bit Rate | File Size (approx) |
|------------|----------|--------|-------------|----------|-------------------|
| alert-high | 2-3 sec | MP3 | 44.1 kHz | 128 kbps | 40-50 KB |
| alert-medium | 1-1.5 sec | MP3 | 44.1 kHz | 128 kbps | 20-30 KB |
| alert-critical | 3-4 sec | MP3 | 44.1 kHz | 128 kbps | 50-70 KB |

### Volume Levels (in code)

The sound manager automatically applies these volume multipliers:
- **Alert High**: 0.8 (80% volume)
- **Alert Medium**: 0.5 (50% volume)
- **Alert Critical**: 1.0 (100% volume)

Users can further adjust via the volume slider in notification settings.

---

## ✅ Quick Setup Checklist

1. [ ] Download 3 sound files from recommended sources
2. [ ] Ensure files are in MP3 format
3. [ ] Rename files to:
   - `alert-high.mp3`
   - `alert-medium.mp3`
   - `alert-critical.mp3`
4. [ ] Place files in `public/sounds/` directory
5. [ ] Test by running:
   ```typescript
   import { soundManager } from '@/utils/soundManager';
   soundManager.play('alert-high');
   ```
6. [ ] Verify sounds play in browser (requires user interaction first)

---

## 🎭 Sound Selection Tips

### For Hotel Environment

**Alert High (Guest Requests, Payments)**
- Should be **attention-grabbing but not alarming**
- Think: "professional bell desk notification"
- Clear, crisp, business-appropriate
- **Avoid**: Harsh beeps, cartoon sounds, ringtones

**Alert Medium (Check-in, Updates)**
- Should be **gentle and non-intrusive**
- Think: "elevator arrival chime"
- Soft, pleasant, background-appropriate
- **Avoid**: Loud dings, sharp tones

**Alert Critical (Emergencies, Escalations)**
- Should be **unmistakably urgent**
- Think: "fire alarm" or "emergency broadcast"
- Commanding, impossible to ignore
- **Can be**: Repetitive, louder, more aggressive

---

## 🔧 Troubleshooting

### Sound files not playing?

1. **Check file location**: Files must be in `public/sounds/` exactly
2. **Check file names**: Must match exactly (case-sensitive)
3. **Check file format**: Must be MP3, not WAV or other formats
4. **Check browser permissions**: Some browsers block audio until user interaction
5. **Check console**: Look for 404 errors or audio decoding errors

### Converting formats

If you have WAV or other formats:
1. Use [CloudConvert](https://cloudconvert.com/wav-to-mp3) (free online converter)
2. Or use FFmpeg: `ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3`

---

## 📱 Mobile Considerations

- Sounds will play on mobile devices (iOS/Android)
- Critical alerts also trigger vibration on mobile (if supported)
- Users can mute notifications via the notification center controls
- PWA users get full notification + sound support

---

## 🎨 Customization (Advanced)

### Custom Sounds Per Department

You can extend the system to use different sounds for different departments:

```typescript
// In soundManager.ts, add new sound types:
const SOUND_CONFIGS = {
  'alert-high': { ... },
  'alert-medium': { ... },
  'alert-critical': { ... },
  // Add custom department sounds
  'restaurant-order': { url: '/sounds/restaurant-bell.mp3', defaultVolume: 0.7 },
  'housekeeping-request': { url: '/sounds/housekeeping-chime.mp3', defaultVolume: 0.6 },
  'maintenance-urgent': { url: '/sounds/maintenance-alert.mp3', defaultVolume: 0.9 }
};
```

Then use them in notification helpers:
```typescript
await createStaffNotification({
  ...
  soundType: 'restaurant-order',
  department: 'RESTAURANT'
});
```

---

## 📚 Licensing & Attribution

### Mixkit
- ✅ Free for commercial use
- ✅ No attribution required
- ✅ Can be used in hotel business

### Pixabay
- ✅ Free under Pixabay Content License
- ✅ No attribution required
- ✅ Can be used commercially

### Freesound.org
- ⚠️ Check individual sound licenses
- 🎯 Prefer "CC0" (Public Domain) sounds
- 📝 Some require attribution (check description)

---

## 🚀 Next Steps

Once you have your sound files:
1. Follow the [Integration Guide](./NOTIFICATION_INTEGRATION_GUIDE.md) to add notifications to your workflows
2. Test with real scenarios
3. Adjust volume levels if needed
4. Consider adding custom sounds per department (optional)

---

**Questions?** Check the main [Phase 4 Documentation](./PHASE_4_NOTIFICATION_SYSTEM.md) for complete system overview.
