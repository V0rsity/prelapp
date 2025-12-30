// pages/signup.tsx
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
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
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Create user profile in database
      const { error: dbError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          timezone,
        })
        .eq('id', authData.user.id);

      if (dbError) throw dbError;

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
      <input 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
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