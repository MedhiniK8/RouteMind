import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, footer = true }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      {footer ? <Footer /> : null}
    </>
  );
}
