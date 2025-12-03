export default function DefaultAvatar({ name, size = 8 }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    if (!name) return colors[0];
    
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <div 
      className={`w-${size} h-${size} ${getRandomColor(name)} rounded-full flex items-center justify-center text-white font-bold`}
    >
      <span className={`text-${size === 8 ? 'lg' : size === 10 ? 'xl' : '2xl'}`}>
        {getInitials(name)}
      </span>
    </div>
  );
}