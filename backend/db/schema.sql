CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  persona TEXT CHECK (persona IN 
    ('student', 'professional', 'entrepreneur')),
  peak_hours TEXT DEFAULT 'morning',
  daily_available_hours FLOAT DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  daily_hours_available FLOAT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN 
    ('active','completed','abandoned','paused')),
  failure_probability FLOAT DEFAULT 0.0,
  execution_health_score INT DEFAULT 100,
  document_url TEXT,
  document_parsed_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  sequence_order INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN 
    ('pending','in_progress','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  title TEXT NOT NULL,
  description TEXT,
  estimated_hours FLOAT NOT NULL DEFAULT 1.0,
  actual_hours FLOAT,
  scheduled_date DATE,
  sequence_order INT,
  status TEXT DEFAULT 'pending' CHECK (status IN 
    ('pending','in_progress','completed','skipped')),
  dependencies INT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE execution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  tasks_completed INT DEFAULT 0,
  tasks_remaining INT DEFAULT 0,
  velocity_actual FLOAT DEFAULT 0.0,
  velocity_required FLOAT DEFAULT 0.0,
  failure_probability FLOAT DEFAULT 0.0,
  health_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL,
  failure_probability FLOAT NOT NULL,
  message TEXT NOT NULL,
  proposed_plan JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN 
    ('pending','accepted','dismissed','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_scheduled_date 
  ON tasks(scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_execution_snapshots_goal_date 
  ON execution_snapshots(goal_id, snapshot_date);
CREATE INDEX idx_agent_events_goal_id 
  ON agent_events(goal_id);
CREATE INDEX idx_interventions_goal_status 
  ON interventions(goal_id, status);
