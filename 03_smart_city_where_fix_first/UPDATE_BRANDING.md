# 🎨 Update Branding to SUDHAR

## ✅ Logo Saved!
`web/public/sudhar-logo.png` - Your professional SUDHAR logo is ready!

---

## 📝 Manual Updates Needed:

### 1. **Login Page** (`web/src/pages/Login.tsx`)

Find this line:
```tsx
<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">FixFirst</h1>
```

Replace with:
```tsx
<div className="mb-4">
  <img src="/sudhar-logo.png" alt="SUDHAR" className="h-20 mx-auto" />
</div>
```

### 2. **Citizen Header** (`web/src/pages/citizen/CitizenLayout.tsx`)

Find:
```tsx
<h1 className="text-xl font-bold text-gray-900 dark:text-white">FixFirst</h1>
```

Replace with:
```tsx
<img src="/sudhar-logo.png" alt="SUDHAR" className="h-8" />
```

### 3. **Admin Sidebar** (`web/src/pages/admin/AdminLayout.tsx`)

Find:
```tsx
<h1 className="text-lg font-bold text-gray-900 dark:text-white">FixFirst</h1>
```

Replace with:
```tsx
<img src="/sudhar-logo.png" alt="SUDHAR" className="h-10" />
```

### 4. **HTML Title** (`web/index.html`)

Find:
```html
<title>FixFirst - Smart City Priority System</title>
```

Replace with:
```html
<title>SUDHAR - सुधार | Smart City Priority System</title>
```

### 5. **Font Change** (`web/tailwind.config.js`)

Change font from Plus Jakarta Sans to Inter:

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Inter', 'system-ui', 'sans-serif'],
},
```

---

## 🎨 **Color Scheme Update (Professional)**

Update `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#f5f5f5',
    100: '#e5e5e5',
    200: '#d4d4d4',
    300: '#a3a3a3',
    400: '#737373',
    500: '#525252',
    600: '#404040',
    700: '#262626',
    800: '#171717',
    900: '#0a0a0a',
    950: '#000000',
  },
  accent: {
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f97316',
    red: '#ef4444',
  }
}
```

---

## 🚀 **Quick Replace All (VS Code)**

Press `Ctrl+Shift+H` and replace:
- `FixFirst` → `SUDHAR`
- `fixfirst` → `sudhar`

**Exclude:** node_modules, dist, build folders

---

## ✨ **Final Touch - Add Tagline**

In all headers, add:
```tsx
<div>
  <img src="/sudhar-logo.png" alt="SUDHAR" className="h-8" />
  <p className="text-xs text-gray-500 mt-1">सुधार - Making Cities Better</p>
</div>
```

---

## ✅ **Checklist:**

- [ ] Logo file saved (`/sudhar-logo.png`) ✓
- [ ] Update Login page
- [ ] Update Citizen header
- [ ] Update Admin sidebar
- [ ] Update HTML title
- [ ] Change font to Inter
- [ ] Test the website

---

## 🎯 **Result:**

Instead of colorful "AI-looking" FixFirst text, you'll have:
- Professional SUDHAR logo image
- Clean, modern Inter font
- Dark, professional color scheme
- Proper branding throughout

**The logo looks much more professional and suitable for government/civic use!**
