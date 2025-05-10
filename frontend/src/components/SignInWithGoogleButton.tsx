import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const SignInWithGoogleButton = () => {
  const handleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ Connecté avec Firebase :", user.uid);
    } catch (err) {
      console.error("❌ Erreur lors de la connexion Firebase :", err);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
    >
      Se connecter avec Google
    </button>
  );
};

export default SignInWithGoogleButton;
