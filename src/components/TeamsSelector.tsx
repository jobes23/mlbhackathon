import React from 'react';
import { TeamsById } from './constants/Teams';

// Define the type for the props
interface TeamsSelectorProps {
  selectedTeams: number[]; // Array of selected team IDs
  onSelectionChange: (updatedTeams: number[]) => void; // Callback to update selected teams
}

const TeamsSelector: React.FC<TeamsSelectorProps> = ({
  selectedTeams,
  onSelectionChange,
}) => {
  // Handle team selection
  const handleTeamClick = (teamId: number) => {
    const updatedTeams = selectedTeams.includes(teamId)
      ? selectedTeams.filter((id) => id !== teamId) // Remove if already selected
      : [...selectedTeams, teamId]; // Add if not selected

    onSelectionChange(updatedTeams); // Auto-save the updated teams
  };

  return (
    <div className="team-grid">
      {/* Use Object.values to iterate over teamsById */}
      {Object.values(TeamsById).map((team) => (
        <div
          key={team.id}
          className={`team-logo-container ${team.className} ${
            selectedTeams.includes(team.id) ? 'selected' : ''
          }`}
          onClick={() => handleTeamClick(team.id)}
        >
          <img src={team.logoURL} alt={team.name} className="team-logo" />
        </div>
      ))}
    </div>
  );
};

export default TeamsSelector;
