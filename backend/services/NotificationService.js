const Notification = require("../models/Notification");
const User = require("../models/User");

class NotificationService {
  /**
   * Send a notification to a specific user.
   * Also triggers an "out of app" push/email.
   */
  static async send(userId, { title, message, type = "system", relatedId = null, relatedModel = null }) {
    try {
      // 1. Create In-App Notification
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        relatedId,
        relatedModel
      });

      // 2. Fetch User to get contact info
      const user = await User.findById(userId);
      if (user && user.email) {
        // Trigger Out of App Notification (Email / Push / SMS)
        console.log(`\n[OUT OF APP NOTIFICATION] -> Sent to ${user.email}`);
        console.log(`[TITLE]: ${title}`);
        console.log(`[MESSAGE]: ${message}\n`);
        
        // TODO: Integrate actual Brevo/SES/FCM here if API keys exist
      }

      return notification;
    } catch (err) {
      console.error("[NotificationService] Error sending notification:", err);
    }
  }

  static async notifyAdminsAndSupervisors(workerId, { title, message, type, relatedId, relatedModel }) {
    try {
      const worker = await User.findById(workerId);
      if (!worker) return;

      const adminId = worker.createdBy;
      if (!adminId) return; // if no admin, nowhere to send

      // 1. Notify Admin
      await this.send(adminId, { title, message, type, relatedId, relatedModel });

      // 2. Notify Supervisors overseeing this worker's role
      const workerRole = (worker.role || "").toLowerCase().trim();
      const supervisors = await User.find({
        createdBy: adminId,
        role: "Supervisor"
      });

      for (const sup of supervisors) {
        const oversees = sup.overseesRoles?.map(r => r.toLowerCase().trim()) || [];
        if (oversees.includes(workerRole)) {
          await this.send(sup._id, { title, message, type, relatedId, relatedModel });
        }
      }
    } catch (err) {
      console.error("[NotificationService] Error in notifyAdminsAndSupervisors:", err);
    }
  }
}

module.exports = NotificationService;
