# PS5 Relapse - Auto Payload

Self-hosted PS5 jailbreak for firmware 7.00 - 13.60 with automatic payload delivery. No PC required after deployment.

## What is this

A fork of [Relapse-Exploit](https://github.com/ntfargo/Relapse-Exploit) modified to automatically load homebrew payloads (kstuff, ShadowMountPlus, etaHEN) after the kernel exploit succeeds. Payloads are sent to elfldr via ROP chain syscalls (socket/connect/write to localhost:9021), eliminating the need for a PC running `nc` or a relay server.

## How to use

1. Open the PS5 browser
2. Navigate to `https://fs0ciety404.github.io/ps5-relapse/`
3. Wait for the exploit to complete
4. Payloads load automatically

Save the URL as a bookmark for quick access after reboots.

## Bundled payloads

- **kstuff** (Kstuff Lite) - Kernel patches, FPKG support, trophy bypass
- **ShadowMountPlus** - Automated game backup mounter (exFAT/UFS/PFS)
- **etaHEN** - Homebrew enabler, debug settings, toolbox

## Credits

This project exists thanks to the work of many researchers and developers:

### Relapse Exploit
**ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen**

### Exploit research and techniques
**TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy**

### Payloads and homebrew
**EchoStretch** (kstuff), **Drakmor** (ShadowMountPlus), **LightningMods** (etaHEN), **VoidWhisper, Gezine, EarthOnion**

### PS5 scene
**Specter, ChendoChap, Znullptr, john-tornblom, astrelsky** and the entire PS5 homebrew community

## License

This repository does not include a license of its own. All original components retain their respective authors' licenses:

- Relapse-Exploit: see [original repo](https://github.com/ntfargo/Relapse-Exploit)
- kstuff: see [EchoStretch/kstuff-lite](https://github.com/EchoStretch/kstuff-lite)
- ShadowMountPlus: see [drakmor/ShadowMountPlus](https://github.com/drakmor/ShadowMountPlus)
- etaHEN: see [etaHEN/etaHEN](https://github.com/etaHEN/etaHEN)

All rights belong to their respective authors. This fork only adds the auto-payload delivery mechanism.

## Disclaimer

For personal use on your own console only. This is a research and educational project.
