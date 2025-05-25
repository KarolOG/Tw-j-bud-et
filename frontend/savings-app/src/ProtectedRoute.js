import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const [valid, setValid] = useState(null); // null = sprawdzanie, true = OK, false = przekieruj

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setValid(false);
      return;
    }

    fetch('http://localhost:8000/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.ok) {
          setValid(true);
        } else {
          localStorage.removeItem('token');
          setValid(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setValid(false);
      });
  }, []);

  if (valid === null) return <p>Sprawdzanie autoryzacji...</p>;
  if (valid === false) return <Navigate to="/login" />;
  return children;
}

export default ProtectedRoute;
