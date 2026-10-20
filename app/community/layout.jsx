export const metadata = {
  title: 'Community — Japan Real Estate Discussions',
  description:
    'A free space to discuss Japan real estate strategy, share leads and ask questions. An account is all you need to post.',
  alternates: { canonical: '/community' },
  robots: { index: false, follow: false }, // gated content — don't index
};

export default function CommunityLayout({ children }) {
  return children;
}
