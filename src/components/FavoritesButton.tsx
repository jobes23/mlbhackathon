import React from "react";
import { FaPlusCircle } from "react-icons/fa";

interface FavoritesButtonProps {
  isOpen: boolean;
  toggle: () => void;
  label: string;
}

const FavoritesButton: React.FC<FavoritesButtonProps> = ({ toggle, label }) => {
  return (
    <button
      className="favorites-button"
      onClick={toggle}
      aria-label={label}
      title={label} // Tooltip for extra clarity
    >
      <div className="addButtonIcon">
        <FaPlusCircle />
      </div>
      <div className="favorites-button-text">{label}</div>
    </button>
  );
};

export default FavoritesButton;
