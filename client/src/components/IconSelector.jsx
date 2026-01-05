function IconSelector({ icons, selectedIcon, onIconSelect }) {
  return (
    <div className="icon-selector">
      {icons.map(icon => (
        <div
          key={icon}
          className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
          onClick={() => onIconSelect(icon)}
        >
          {icon}
        </div>
      ))}
    </div>
  )
}

export default IconSelector
