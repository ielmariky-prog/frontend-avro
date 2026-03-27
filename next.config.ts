const nextConfig = {
  // On dit à Vercel d'ignorer les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },
  // On lui dit aussi d'ignorer les erreurs de syntaxe ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;