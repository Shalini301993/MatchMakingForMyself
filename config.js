// Everything Shalini may want to change lives here. Edit, commit, and the site updates.

export const CONFIG = {
  goddessName: 'Shalini',

  // Her chart, used for the compatibility reading in the Trial of the Stars.
  chart: { sun: 'Leo', moon: 'Capricorn', rising: 'Capricorn' },

  // Private inbox (Supabase). Fill both in to save every offering to your own database, read
  // them at inbox.html. The anon / publishable key is meant to be public: the database only lets
  // it ADD offerings, never read them. See README → "Private inbox".
  storage: {
    url: '',      // Project URL, e.g. https://abcdefgh.supabase.co
    anonKey: '',  // Project API key: "anon" or "publishable"
  },

  // Optional alternative: a Google Form that receives every finished (or turned-away) questionnaire.
  // Until formId is filled in, the site runs in demo mode: nothing is sent, and at the end
  // he can copy or download his answers instead. See README → "Receiving answers".
  googleForm: {
    // The long id in the form's share link: https://docs.google.com/forms/d/e/<formId>/viewform
    formId: '',
    // One "entry.NNNN" id per question in the form (read them from "Get pre-filled link").
    fields: {
      verdict: '',      // "Passed the gate" or "Turned away: <reason>"
      name: '',
      contact: '',
      age: '',
      city: '',
      truth: '',        // Gate of Truth answers (dealbreakers)
      fire: '',         // Trial of Fire (rapid fire)
      stars: '',        // Trial of the Stars (astrology, Human Design)
      heart: '',        // Trial of the Heart (love languages)
      mirror: '',       // Trial of the Mirror (strengths, weaknesses)
      memory: '',       // Trial of Memory (past relationships)
      vow: '',          // Trial of the Vow (emotional, sexual, financial care)
      hearth: '',       // Trial of the Hearth (kids, the wife he envisions)
      desire: '',       // Trial of Desire (kinks)
    },
  },

  // Dealbreakers. Any answer listed under `values` ends the quest (his answers are still sent,
  // marked as turned away). Questions not listed here are only recorded.
  dealbreakers: [
    { question: 'drinking', values: ['heavy'], reason: 'drinks heavily' },
    { question: 'married', values: ['married', 'separated', 'divorced', 'widowed'], reason: 'has been married before' },
    { question: 'kids', values: ['yes', 'expecting'], reason: 'has children' },
  ],
};
