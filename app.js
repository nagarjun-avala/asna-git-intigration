require("dotenv").config();
const Asana = require("asana");

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];

  const payload = JSON.stringify(req.body);

  if (verifySignature(payload, signature)) {
    if (req.body.action === "opened") {
      const issue = req.body.issue;
      if (issue) {
        console.log("Issue created:", issue);
        // createAsanaTask(issue);
      }
    }
    res.status(200).send("OK");
  } else {
    res.status(401).send("Signature verification failed");
  }
});

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac("sha256", process.env.GITHUB_SECRET);

  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function createAsanaTask(issue) {
  const data = {
    name: issue.title,
    notes: issue.body,
    projects: [process.env.ASANA_PROJECT_ID],
    workspace: process.env.ASANA_WORKSPACE_ID,
    external: {
      data: issue.html_url,
    },
    // assignee: getAsanaUser(issue.user.login),
  };

  let client = Asana.ApiClient.instance;
  let token = client.authentications["token"];
  token.accessToken = process.env.ASANA_ACCESS_TOKEN;

  let tasksApiInstance = new Asana.TasksApi();
  let body = { data };
  let opts = {
    opt_fields:
      "actual_time_minutes,approval_status,assignee,assignee.name,assignee_section,assignee_section.name,assignee_status,completed,completed_at,completed_by,completed_by.name,created_at,created_by,custom_fields,custom_fields.asana_created_field,custom_fields.created_by,custom_fields.created_by.name,custom_fields.currency_code,custom_fields.custom_label,custom_fields.custom_label_position,custom_fields.date_value,custom_fields.date_value.date,custom_fields.date_value.date_time,custom_fields.description,custom_fields.display_value,custom_fields.enabled,custom_fields.enum_options,custom_fields.enum_options.color,custom_fields.enum_options.enabled,custom_fields.enum_options.name,custom_fields.enum_value,custom_fields.enum_value.color,custom_fields.enum_value.enabled,custom_fields.enum_value.name,custom_fields.format,custom_fields.has_notifications_enabled,custom_fields.id_prefix,custom_fields.is_formula_field,custom_fields.is_global_to_workspace,custom_fields.is_value_read_only,custom_fields.multi_enum_values,custom_fields.multi_enum_values.color,custom_fields.multi_enum_values.enabled,custom_fields.multi_enum_values.name,custom_fields.name,custom_fields.number_value,custom_fields.people_value,custom_fields.people_value.name,custom_fields.precision,custom_fields.representation_type,custom_fields.resource_subtype,custom_fields.text_value,custom_fields.type,dependencies,dependents,due_at,due_on,external,external.data,followers,followers.name,hearted,hearts,hearts.user,hearts.user.name,html_notes,is_rendered_as_separator,liked,likes,likes.user,likes.user.name,memberships,memberships.project,memberships.project.name,memberships.section,memberships.section.name,modified_at,name,notes,num_hearts,num_likes,num_subtasks,parent,parent.created_by,parent.name,parent.resource_subtype,permalink_url,projects,projects.name,resource_subtype,start_at,start_on,tags,tags.name,workspace,workspace.name",
  };
  tasksApiInstance.createTask(body, opts).then(
    (result) => {
      result = { ...result };
      console.log("API called successfully.");
    },
    (error) => {
      console.error(error.response.body, data);
    }
  );
}

function getAsanaUser(githubUsername) {
  // Implement a method to map GitHub username to Asana user ID

  return githubUsername;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
