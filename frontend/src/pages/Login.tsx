// Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await fetch("https://api.askeliott.com/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ email: user.email }),
        });
        navigate("/request");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();

      await fetch("https://api.askeliott.com/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email }),
      });

      navigate("/request");
    } catch (error) {
      console.error("❌ Erreur de connexion :", error);
      alert("Identifiants incorrects.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      await fetch("https://api.askeliott.com/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: user.email }),
      });

      navigate("/request");
    } catch (error) {
      console.error("❌ Erreur Google Sign-In :", error);
      alert("Erreur lors de la connexion avec Google.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#2563eb]">
      <div className="bg-white p-10 rounded-2xl shadow max-w-md w-full">
        <img src="/eliott-logo.png" alt="Eliott" className="mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-center mb-6">Bienvenue à nouveau !</h2>

        <button onClick={handleGoogleLogin} className="w-full border px-4 py-2 rounded-full mb-4">
          Google
        </button>

        <p className="text-center text-sm mb-4">ou</p>

        <form onSubmit={handleLogin}>
          <label className="block text-sm mb-1">Adresse email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg"
          />

          <label className="block text-sm mb-1">Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-6 border rounded-lg"
          />

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full">
            Se connecter
          </button>
        </form>

        <p className="text-sm text-center mt-6">
          Pas encore de compte ? <Link to="/create-account" className="underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
