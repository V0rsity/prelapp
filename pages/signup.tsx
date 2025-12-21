import { useState, useContext, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";

export default function Signup() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone); // default
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleSignup = async () => {
    setError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName,
        lastName,
        email,
        timezone,
        createdAt: new Date(),
        isPremium: false,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Create Account</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        placeholder="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <input
        placeholder="Timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
      />

      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
}
