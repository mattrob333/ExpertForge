-- ExpertForge Schema Migration: Department Field for Filtering
-- Migration 004: Add department column to org_node_agents and experts for team chat filtering
-- Run this AFTER 003_expert_resources_schema.sql

-- ============================================================================
-- PART 1: ADD DEPARTMENT FIELD TO ORG_NODE_AGENTS
-- ============================================================================

ALTER TABLE public.org_node_agents 
ADD COLUMN IF NOT EXISTS department text;

-- Standard departments: Executive, Sales, Marketing, Operations, Finance, Technology, Human Resources, Strategy, Product, Legal
COMMENT ON COLUMN public.org_node_agents.department IS 
'Department for filtering: Executive, Sales, Marketing, Operations, Finance, Technology, Human Resources, Strategy, Product, Legal';

-- ============================================================================
-- PART 2: ADD DEPARTMENT FIELD TO EXPERTS
-- ============================================================================

ALTER TABLE public.experts 
ADD COLUMN IF NOT EXISTS department text;

COMMENT ON COLUMN public.experts.department IS 
'Department for filtering in team chat: Executive, Sales, Marketing, Operations, Finance, Technology, Human Resources, Strategy, Product, Legal';

-- ============================================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS org_node_agents_department_idx 
ON public.org_node_agents(department);

CREATE INDEX IF NOT EXISTS experts_department_idx 
ON public.experts(department);

-- Composite index for common query pattern: team + department
CREATE INDEX IF NOT EXISTS org_node_agents_team_department_idx 
ON public.org_node_agents(team_id, department);

CREATE INDEX IF NOT EXISTS experts_team_department_idx 
ON public.experts(team_id, department);

-- ============================================================================
-- PART 4: HELPER FUNCTION - GET TEAM DEPARTMENTS
-- Returns list of unique departments in a team for building filter dropdown
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_team_departments(p_team_id uuid)
RETURNS text[] AS $$
DECLARE
  v_departments text[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT department ORDER BY department)
  INTO v_departments
  FROM public.org_node_agents
  WHERE team_id = p_team_id
  AND department IS NOT NULL;
  
  RETURN COALESCE(v_departments, ARRAY[]::text[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: HELPER FUNCTION - GET AGENTS BY DEPARTMENT
-- Returns agent details filtered by department
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_agents_by_department(p_team_id uuid, p_department text)
RETURNS TABLE (
  agent_id uuid,
  agent_name text,
  role_title text,
  department text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as agent_id,
    e.name as agent_name,
    ona.role_title,
    ona.department,
    e.avatar_url
  FROM public.experts e
  JOIN public.org_node_agents ona ON ona.primary_agent_id = e.id
  WHERE ona.team_id = p_team_id
  AND (p_department IS NULL OR p_department = 'all' OR ona.department = p_department);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
