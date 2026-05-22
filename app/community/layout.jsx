export const metadata = {
  title: 'Community — Members-only Japan real estate discussions',
  description:
    'Private member space for Yama Vista subscribers to discuss Japan real estate strategy, share leads, and ask questions of the community.',
  alternates: { canonical: '/community' },
  robots: { index: false, follow: false }, // gated content — don't index
};

export default function CommunityLayout({ children }) {
  return children;
}
