import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './api/axiosConfig'; // Import the API configuration for making requests
import ImageDisplay from './ImageDisplay'; // Import component for displaying images
import Howler from 'react-howler'; // Import sound management library
import './TimerControl.css'; // Import styles for the component

const TimerControl = () => {
  // State variables for timer functionality
  const [timer, setTimer] = useState(0); // Remaining time in seconds
  const [isActive, setIsActive] = useState(false); // Indicates if the timer is active
  const [inputMinutes, setInputMinutes] = useState(''); // User input for minutes
  const [inputSeconds, setInputSeconds] = useState(''); // User input for seconds
  const [totalDuration, setTotalDuration] = useState(0); // Total timer duration
  const [pausedTime, setPausedTime] = useState(null); // Time when paused
  const [isTimeUp, setIsTimeUp] = useState(false); // Indicates if time is up
  const [isSoundPlaying, setSoundPlaying] = useState(false); // Indicates if alarm sound is playing
  const [hasStarted, setHasStarted] = useState(false); // Indicates if the timer has started
  const [playSound, setPlaySound] = useState(true); // User preference for playing sound
  const [fetchImageTrigger, setFetchImageTrigger] = useState(false); // Triggers image fetch
  const [alarmStopped, setAlarmStopped] = useState(false); // Indicates if the alarm is stopped

  const navigate = useNavigate(); // Hook to programmatically navigate

  // Effect to check if user is authenticated when the component mounts
  useEffect(() => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (!token || !userId) {
      console.error('Please sign in to access a timer'); // Log an error if missing
      navigate('/'); // Redirect to home if missing
    }
  }, []);

  // Effect to handle the countdown timer
  useEffect(() => {
    let interval = null; // Variable to hold interval ID
    if (isActive) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer > 0) {
            return prevTimer - 1; // Decrement timer
          } else {
            clearInterval(interval); // Clear interval when time is up
            setIsActive(false); // Stop the timer
            setIsTimeUp(true); // Indicate time is up
            if (playSound) {
              setSoundPlaying(true); // Play sound if enabled
            }
            return 0; // Set timer to zero
          }
        });
      }, 1000); // Update every second
    } else if (!isActive && timer !== 0) {
      clearInterval(interval); // Clear interval if timer is paused
    }
    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [isActive, timer, playSound]);

  // Function to start the timer
  const startTimer = async () => {
    const minutes = parseInt(inputMinutes, 10) || 0; // Parse minutes input
    const seconds = parseInt(inputSeconds, 10) || 0; // Parse seconds input
    const duration = minutes * 60 + seconds; // Calculate total duration in seconds

    if (duration > 0) {
      try {
        const token = localStorage.getItem('token'); // Retrieve token
        const userId = localStorage.getItem('userId'); // Retrieve userId

        if (!token || !userId) {
          throw new Error('No authentication token or userId found.'); // Handle missing credentials
        }

        // Check user status from the API
        const response = await api.get(`/user-status/${userId}`, {
          headers: { Authorization: `Bearer ${token}` } // Include auth token
        });

        console.log(response.data); // Log response data

        // Check if the trial period is over and limit timer duration
        if (response.data.trialPeriodOver && response.data.hasPaid === false && duration > 60) {
          alert('Your trial period is over. You can only use timers for 60 seconds or less with the unpaid version.');
          return; // Exit if trial restrictions are violated
        }

        // Start the timer on the server
        await api.post('/start-timer', {}, {
          headers: { Authorization: `Bearer ${token}` } // Include auth token
        });

        // Update state variables to start the timer
        setTimer(duration);
        setTotalDuration(duration);
        setIsActive(true);
        setPausedTime(null);
        setIsTimeUp(false);
        setSoundPlaying(false);
        setHasStarted(true);
        setAlarmStopped(false);

      } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message); // Log error details
        alert('Error starting timer: ' + (error.response?.data.message || 'An error occurred')); // Alert user
      }
    } else {
      alert('Please enter a valid duration.'); // Prompt for valid duration
    }
  };

  // Function to pause the timer
  const pauseTimer = () => {
    setIsActive(false); // Stop the timer
    setPausedTime(timer); // Save current timer value
  };

  // Function to resume the timer
  const resumeTimer = () => {
    setIsActive(true); // Restart the timer
  };

  // Function to reset the timer
  const resetTimer = () => {
    setIsActive(false); // Stop the timer
    setTimer(0); // Reset timer value
    setTotalDuration(0); // Reset total duration
    setPausedTime(null); // Clear paused time
    setIsTimeUp(false); // Reset time up status
    setSoundPlaying(false); // Stop any sound
    setHasStarted(false); // Reset started status
    setFetchImageTrigger(prev => !prev); // Trigger image update
    setAlarmStopped(false); // Reset alarm stopped status
  };

  // Function to stop the alarm sound
  const stopSound = () => {
    setSoundPlaying(false); // Stop sound playback
    setAlarmStopped(true); // Set alarm stopped status
  };

  // Function to toggle sound preference
  const handleSoundToggle = () => {
    setPlaySound(!playSound); // Toggle sound setting
  };

  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    localStorage.removeItem('userId'); // Remove userId from localStorage
    navigate('/'); // Redirect to home
  };

  return (
    <div className="timer-control-container">
      <div className="navbar">
        <Link to="/Profile">
          <button className="profile-button">Profile</button> {/* Link to Profile page */}
        </Link>
        <button onClick={handleLogout} className="logout-button">
          Logout {/* Logout button */}
        </button>
      </div>

      {/* Input controls for timer if it hasn't started */}
      {!hasStarted && (
        <div className="input-controls">
          <label>
            Minutes:
            <input
              type="number"
              value={inputMinutes} // Bind to state
              onChange={(e) => setInputMinutes(e.target.value)} // Update state on change
              placeholder="0" // Placeholder text
              min="0" // Minimum value
              className="time-input"
            />
          </label>
          <label>
            Seconds:
            <input
              type="number"
              value={inputSeconds} // Bind to state
              onChange={(e) => setInputSeconds(e.target.value)} // Update state on change
              placeholder="0" // Placeholder text
              min="0" // Minimum value
              max="59" // Maximum value for seconds
              className="time-input"
            />
          </label>

          <button onClick={startTimer}>Start</button> {/* Start timer button */}
          <div className="sound-toggle">
            <label>
              <input
                type="checkbox"
                checked={playSound} // Bind to sound preference state
                onChange={handleSoundToggle} // Toggle sound preference
              />
              Play Alarm Sound
            </label>
          </div>
        </div>
      )}

      {/* Controls displayed if timer has started and is not yet up */}
      {hasStarted && !isTimeUp && (
        <div className="timer-button-container">
          {isActive ? (
            <button onClick={pauseTimer}>Pause</button> // Pause button
          ) : pausedTime !== null ? (
            <button onClick={resumeTimer}>Resume</button> // Resume button if paused
          ) : null}
          <button onClick={resetTimer}>Reset</button> {/* Reset button */}
        </div>
      )}

      {/* Display remaining time */}
      {hasStarted && (
        <div className="timer-info">
          <span>Time left: {timer} seconds</span> {/* Display time left */}
        </div>
      )}

      {/* Display images based on timer state */}
      <div className="image-display-container">
        <ImageDisplay key={fetchImageTrigger} timer={timer} totalDuration={totalDuration} fetchImageTrigger={fetchImageTrigger} />
      </div>

      {/* Display when time is up */}
      {isTimeUp && (
        <div className="time-up-container">
          {playSound && !alarmStopped ? (
            <>
              <div className="stop-alarm-message">Press stop alarm to turn off alert</div>
              <br />
              <button onClick={stopSound} className="stop-alarm-button">Stop Alarm</button> {/* Stop alarm button */}
              <Howler
                src="/alarm.mp3" // Source of the alarm sound
                playing={true} // Play sound
                loop={true} // Loop the sound
                volume={1} // Set volume level
              />
            </>
          ) : (
            <div>
              <br />
              <div className="times-up-message">Time's Up! Press Reset for a new timer.</div>
              <br />
              <button onClick={resetTimer} className="reset-button">Reset</button> {/* Reset button when time is up */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerControl;
