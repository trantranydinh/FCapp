import "../styles/globals.css";
import { AuthProvider } from "../components/AuthProvider";

const App = ({ Component, pageProps }) => {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
};

export default App;
