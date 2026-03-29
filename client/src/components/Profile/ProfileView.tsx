import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import DeleteButton from "../Buttons/DeleteButton";
import ReturnButton from "../Buttons/ReturnButton";

export default function ProfileView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useSetTitle("Mein Profil");

  if (!user) {
    return <div>Bitte logge dich ein.</div>;
  }

  return (
    <div className="content">
      <div className="profile-view-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="profile-info">
            <h1>{user.email}</h1>
            <p>Benutzer</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-label">Registriert am</span>
            <span className="stat-value">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">E-Mail</span>
            <span className="stat-value">{user.email}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="button" 
            onClick={() => navigate("/profile/edit")}
          >
            Profil bearbeiten
          </button>
          <DeleteButton
            onDelete={() => handleDeleteProfile()}
            onToggleVisibility={(isOpen) => {
              if (isOpen) {
                const confirm = window.confirm(
                  "Bist du sicher, dass du dein Profil löschen möchtest? Alle deine Daten werden unwiderruflich gelöscht."
                );
                if (confirm) {
                  handleDeleteProfile();
                }
              }
            }}
            isOpen={false}
          />
        </div>
      </div>
    </div>
  );
}

const handleDeleteProfile = async () => {
  try {
    await apiService.deleteProfile();
    window.location.href = "/login";
  } catch (error) {
    console.error("Fehler beim Löschen des Profils:", error);
    alert("Fehler beim Löschen des Profils. Bitte versuche es später erneut.");
  }
};
