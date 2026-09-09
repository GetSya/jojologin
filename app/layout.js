import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export const metadata = {
  title: "JojoBot — Login & Register",
  description: "Login dan Register JojoBot dengan Next.js + JVault",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
