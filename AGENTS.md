# Architecture rules
- Keep all existing URL, screenshot and chat server contracts unchanged during branding and frontend upgrades, to avoid unrelated model or analysis regressions.
- Deepfake media checks use an isolated, explicitly simulated browser adapter until a validated detector is connected, so demo scores never masquerade as evidence.
- Keep media capture and emergency geolocation in browser event/effect boundaries and release streams/timers on exit, for SSR compatibility and privacy.
- Community maps aggregate approved reports at known regional centers rather than publish precise incident coordinates, to protect anonymity and avoid fabricated locations.
- Community vote counts are aggregated by a restricted database function; feedback is anonymously writable and readable only by verified administrators, to minimize public data exposure.
- Leaf routes use the shared page-head helper for unique VeriSafe metadata, to keep branding consistent.