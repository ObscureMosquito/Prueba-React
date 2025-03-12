import { useState } from "react";
import { motion } from "framer-motion";
import {
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Fab,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const RemindersWidget = () => {
  const [reminders, setReminders] = useState(
    JSON.parse(localStorage.getItem("reminders")) || []
  );
  const [newReminder, setNewReminder] = useState("");

  const handleAddReminder = () => {
    if (!newReminder.trim()) return;
    const updatedReminders = [...reminders, { text: newReminder, completed: false }];
    setReminders(updatedReminders);
    localStorage.setItem("reminders", JSON.stringify(updatedReminders));
    setNewReminder("");
  };

  const toggleReminder = (index) => {
    const updatedReminders = reminders.map((reminder, i) =>
      i === index ? { ...reminder, completed: !reminder.completed } : reminder
    );
    setReminders(updatedReminders);
    localStorage.setItem("reminders", JSON.stringify(updatedReminders));
  };

  const handleDeleteReminder = (index) => {
    const updatedReminders = reminders.filter((_, i) => i !== index);
    setReminders(updatedReminders);
    localStorage.setItem("reminders", JSON.stringify(updatedReminders));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Paper
        sx={{
          width: "350px",
          maxWidth: "100%",
          backdropFilter: "blur(20px) saturate(150%)",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "inset 0.5px 1px 1px rgba(255,255,255,0.125)",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 500 }}>
          📝 Reminders
        </Typography>

        <List sx={{ mt: 2 }}>
          {reminders.map((reminder, index) => (
            <ListItem key={index} sx={{ textDecoration: reminder.completed ? "line-through" : "none", color: "white" }}>
              <Checkbox checked={reminder.completed} onChange={() => toggleReminder(index)} sx={{ color: "white" }} />
              <ListItemText primary={reminder.text} />
              <IconButton edge="end" color="error" onClick={() => handleDeleteReminder(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>

        <TextField fullWidth placeholder="New Reminder" value={newReminder} onChange={(e) => setNewReminder(e.target.value)} sx={{ mt: 2 }} />
        <Fab color="primary" size="small" sx={{ mt: 2 }} onClick={handleAddReminder}>
          <AddIcon />
        </Fab>
      </Paper>
    </motion.div>
  );
};

export default RemindersWidget;
