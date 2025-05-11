// Signup.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      const idToken = await user.getIdToken();

      await fetch("https://api.askeliott.com/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      navigate("/request");
    } catch (err) {
      console.error("❌ Erreur Firebase Signup :", err);
      alert("Erreur lors de la création du compte. Vérifiez l'adresse email ou le mot de passe.");
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const displayName = user.displayName || "";
      const [firstName, lastName] = displayName.split(" ");

      await fetch("https://api.askeliott.com/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ firstName, lastName, email: user.email }),
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
        <h2 className="text-2xl font-bold text-center mb-6">Essayez gratuitement</h2>

        <button onClick={handleGoogleSignup} className="w-full border px-4 py-2 rounded-full mb-4">
          Google
        </button>

        <p className="text-center text-sm mb-4">ou</p>

        <form id="signup-form" onSubmit={handleSubmit}>
          <label className="block text-sm mb-1">Prénom</label>
          <input
            type="text"
            id="firstName"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg"
          />

          <label className="block text-sm mb-1">Nom</label>
          <input
            type="text"
            id="lastName"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg"
          />

          <label className="block text-sm mb-1">E-mail professionnel</label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg"
          />

          <label className="block text-sm mb-1">Mot de passe</label>
          <input
            type="password"
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-6 border rounded-lg"
          />

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-full">
            Créer un compte
          </button>
        </form>

        <p className="text-sm text-center mt-6">
          Vous avez déjà un compte ? <Link to="/login" className="underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
