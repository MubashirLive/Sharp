# Mobile App Plan & Philosophy

**Philosophy**: The Mobile App is designed for "on-the-go" tasks. It will not have 1:1 feature parity with the Web App. The Web App will retain full control and advanced features, while the Mobile App will be streamlined to focus on frequent, day-to-day actions needed most of the time by users.

🔷 Consolidated Mobile Stack (React Native + Expo)
Layer	Choice	Reason
Framework	Expo (Managed Workflow) + Metro	Standard React Native toolchain, OTA updates, EAS
Language	TypeScript (strict)	Same as web
Navigation	Expo Router (file‑based)	Type‑safe, deep linking, similar to Remix/Next.js
Styling	NativeWind (Tailwind on RN)	Same utility classes as your web app
UI Components	React Native Reusables/gluestack ui/Tamagui	Direct port of shadcn/ui — identical developer experience
Server State	TanStack Query	Same hooks, same cache — share code across platforms
Local State	Zustand (optional)	Lightweight, works identically on RN
Database & Auth	Supabase (@supabase/supabase-js)	Same project, RLS, real‑time — no changes
Auth Flows	expo-auth-session + expo-linking	OAuth / magic link deep linking
File Upload	expo-image-picker / expo-document-picker	Native camera & file access
Push Notifications	expo-notifications + Supabase Edge Functions	Native push with your existing backend
Unit / Component Tests	Jest + React Native Testing Library	Near‑identical API to Vitest + RTL
E2E Tests	Maestro	YAML‑based, no native build config — practical for small teams
Build & Deploy	EAS Build + EAS Submit	CI/CD to stores without local Xcode/Android Studio
OTA Updates	EAS Update	Instant bug fixes without store review