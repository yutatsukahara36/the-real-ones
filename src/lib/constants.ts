export const FRIENDS = ['Yuta', 'Satvik', 'Ty', 'Noah', 'Hojeong', 'Koji', 'Kenshin', 'Hikaru'] as const;

export type FriendName = typeof FRIENDS[number];

export const SELF_QUESTIONS: Record<string, string> = {
  '1.1': 'What role do you play in this group? Be honest.',
  '1.2': 'What do you take from this group? What do you give?',
  '1.3': 'How would this group change if you left tomorrow?',
};

export const PEER_QUESTIONS: Record<string, (name: string) => string> = {
  '2.1': (name) => `What does ${name} give to the group? What do they take?`,
  '2.2': (name) => `Does ${name} challenge you or comfort you? How?`,
  '2.3': (name) => `How would your life change if ${name} wasn't in it?`,
  '2.4': (name) => `Would you call ${name} at your worst moment? Why or why not?`,
  '2.5': (name) => `Describe your relationship with ${name} in one honest sentence.`,
};

export const GROUP_QUESTIONS: Record<string, string> = {
  '3.1': "What's the best thing about this group?",
  '3.2': "What's the thing nobody says but everyone feels?",
  '3.3': 'Where does this group need to grow?',
};

export const MIN_ANSWER_LENGTH = 20;

export const PROFILE_PICS: Record<string, string> = {
  Yuta: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/yuta.png',
  Satvik: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/Satvik.png',
  Ty: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/ty.png',
  Noah: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/noah.png',
  Hojeong: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/Hojon.png',
  Koji: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/Koji.png',
  Kenshin: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/Kenshin.png',
  Hikaru: 'https://gtykovpgruhgxgotmmfl.supabase.co/storage/v1/object/public/others/hikaru.png',
};
