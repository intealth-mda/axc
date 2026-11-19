# `system.<context>.passport.ts`

Path: `<domain>/domain/iam/system/contexts/system.<context>.passport.ts`

The class extends the repo's system passport base, implements `<context>.passport.ts`, and returns `{ determineIf: (func) => func(permissions) }`. Add the getter on the system passport and on the staff-user passport. Do not replace those classes.
