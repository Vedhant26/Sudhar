import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Auth
      login: 'Login',
      email: 'Email',
      password: 'Password',
      loginAs: 'Quick Login',
      
      // Navigation
      home: 'Home',
      map: 'Map',
      report: 'Report',
      rewards: 'Rewards',
      profile: 'Profile',
      
      // Report
      reportIssue: 'Report Issue',
      takePhoto: 'Take Photo',
      category: 'Category',
      description: 'Description',
      submit: 'Submit',
      
      // Categories
      pothole: 'Pothole/Road damage',
      flooding: 'Flooding/Waterlogging',
      drainage: 'Drainage',
      streetlight: 'Streetlight',
      traffic: 'Traffic/Signal',
      pedestrian: 'Pedestrian safety',
      garbage: 'Garbage',
      other: 'Other',
      
      // Status
      submitted: 'Submitted',
      aiTriaged: 'AI Triaged',
      adminVerified: 'Verified',
      govtNotified: 'Sent to Government',
      assigned: 'Assigned',
      inProgress: 'In Progress',
      fixed: 'Fixed',
      closed: 'Closed',
      
      // Rewards
      civicCoins: 'CivicCoins',
      level: 'Level',
      badges: 'Badges',
      leaderboard: 'Leaderboard',
      
      // Common
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      loading: 'Loading...',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
