import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import { User } from "../../types/user";
import { useSetTitle } from "../../hooks/useSetTitle";
import ReturnButton from "../Buttons/ReturnButton";
import Popup from "../Popup";

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    email: "",
    name: "",
    bio: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [popupRef, setPopupRef] = useState<any>(null);

  useSetTitle("Profil bearbeiten");

  useEffect(() => {
    if (user) {
      setProfile({
        email: user.email || "",
        name: user.name || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.updateProfile({
        email: profile.email,
        name: profile.name,
        bio: profile.bio,
      });
      
      popupRef.current?.show("Profil erfolgreich aktualisiert!", 200);
      navigate("/profile");
    } catch (error) {
      popupRef.current?.show("Fehler beim Aktualisieren des Profils", 500);
      console.error("Fehler beim Aktualisieren:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="content">
      <div className="profile-edit-container">
        <h1>Profil bearbeiten</h1>
        
        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="Dein Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              placeholder="Deine E-Mail"
              disabled
            />
            <small>E-Mail kann nicht geändert werden</small>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Über dich..."
              rows={4}
            />
          </div>

          <div className="button-container">
            <ReturnButton onBack={() => navigate("/dashboard")} />
            <button 
              className="button" 
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
