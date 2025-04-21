"use client";

import supabase from "@/lib/supabase/client";
import { useAuth } from "@/resources/auth/auth-hook";
import { useTeam } from "@/resources/team/team-hook";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import SurveyContext, { SurveyState, initialState } from "./survey-context";
import {
  DemographicFormValues,
  OpenQuestionsFormValues,
  Question,
  RadarDataPoint,
  SurveyFormValues,
  SurveyResponses,
} from "./survey-model";
import { SurveyService } from "./survey.service";

interface SurveyProviderProps {
  children: ReactNode;
}

export const SurveyProvider: React.FC<SurveyProviderProps> = ({ children }) => {
  const [state, setState] = useState<SurveyState>(initialState);
  const { user } = useAuth();
  const { selectedTeam } = useTeam();

  // Estados adicionais para pesquisa
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);

  // Métodos centralizados para atualização de estado
  const updateError = useCallback(
    (type: keyof SurveyState["error"], message: string | null) => {
      setState((prev) => ({
        ...prev,
        error: { ...prev.error, [type]: message },
      }));
    },
    []
  );

  const updateLoading = useCallback(
    (type: keyof SurveyState["loading"], isLoading: boolean) => {
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, [type]: isLoading },
      }));
    },
    []
  );

  // Função para atualizar o ID do usuário
  const updateUserId = useCallback((userId: string | null) => {
    setState((prev) => ({ ...prev, userId }));
  }, []);

  // Função para atualizar o ID da equipe
  const updateTeamId = useCallback((teamId: string | null) => {
    setState((prev) => ({ ...prev, teamId }));
  }, []);

  // Buscar IDs do usuário e equipe
  const fetchTeamMemberId = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error("Email do usuário não encontrado");
      }

      let { data: teamMembers } = await supabase
        .from("team_members")
        .select("user_id, team_id")
        .eq("email", user.email)
        .single();

      if (!teamMembers) {
        throw new Error("Membro da equipe não encontrado");
      }

      const userId = teamMembers.user_id;
      const teamId = teamMembers.team_id;

      if (userId && teamId) {
        updateUserId(userId);
        updateTeamId(teamId);
        return { userId, teamId };
      }

      return null;
    } catch (error: any) {
      console.error("Erro ao buscar IDs:", error);
      return null;
    }
  }, []);

  // Carregar dados demográficos
  const loadDemographicData = useCallback(async () => {
    try {
      updateLoading("demographicData", true);

      if (!state.userId || !state.teamId) {
        const ids = await fetchTeamMemberId();
        if (!ids) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
        updateUserId(ids.userId);
        updateTeamId(ids.teamId);
      }

      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }

      const demographicData = await SurveyService.loadDemographicData(
        state.userId,
        state.teamId
      );
      setState((prev) => ({ ...prev, demographicData }));
      return demographicData;
    } catch (error: any) {
      updateError(
        "demographicData",
        error.message || "Erro ao carregar dados demográficos"
      );
      return null;
    } finally {
      updateLoading("demographicData", false);
    }
  }, [state.userId, state.teamId]);

  // Salvar dados demográficos
  const saveDemographicData = useCallback(
    async (data: DemographicFormValues): Promise<boolean> => {
      try {
        updateLoading("saving", true);

        if (!state.userId || !state.teamId) {
          throw new Error("ID do usuário ou equipe não encontrado");
        }

        await SurveyService.saveDemographicData(
          state.userId,
          state.teamId,
          data
        );
        const savedData = await SurveyService.loadDemographicData(
          state.userId,
          state.teamId
        );

        setState((prev) => ({
          ...prev,
          demographicData: savedData,
          error: { ...prev.error, demographicData: null },
        }));

        return true;
      } catch (error: any) {
        updateError(
          "demographicData",
          error.message || "Erro ao salvar dados demográficos"
        );
        return false;
      } finally {
        updateLoading("saving", false);
      }
    },
    [state.userId, state.teamId]
  );

  // Carregar dados do perfil do usuário
  const loadSurveyResponses = useCallback(async () => {
    try {
      updateLoading("survey", true);

      if (!state.userId || !state.teamId) {
        const ids = await fetchTeamMemberId();
        if (!ids) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
        updateUserId(ids.userId);
        updateTeamId(ids.teamId);
      }

      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }

      const surveyResponse = await SurveyService.loadSurveyResponses(
        state.userId,
        state.teamId
      );

      if (surveyResponse) {
        setState((prev) => ({
          ...prev,
          surveyResponses: surveyResponse.responses,
          error: { ...prev.error, survey: null },
        }));
        setAnswers(surveyResponse.responses);
      }

      return surveyResponse;
    } catch (error: any) {
      updateError("survey", error.message || "Erro ao carregar respostas");
      return null;
    } finally {
      updateLoading("survey", false);
    }
  }, [state.userId, state.teamId]);

  // Salvar respostas do questionário
  const saveSurveyResponses = useCallback(
    async (data: SurveyFormValues): Promise<boolean> => {
      try {
        updateLoading("saving", true);

        if (!state.userId || !state.teamId) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }

        await SurveyService.saveSurveyResponses(
          state.userId,
          state.teamId,
          data
        );

        setState((prev) => ({
          ...prev,
          surveyResponses: data,
          error: { ...prev.error, survey: null },
        }));

        return true;
      } catch (error: any) {
        updateError("survey", error.message || "Erro ao salvar respostas");
        return false;
      } finally {
        updateLoading("saving", false);
      }
    },
    [state.userId, state.teamId]
  );

  // Carregar respostas das perguntas abertas
  const loadOpenQuestions = useCallback(async () => {
    try {
      updateLoading("openQuestions", true);

      if (!state.userId || !state.teamId) {
        const result = await fetchTeamMemberId();
        if (!result) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
      }

      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }

      const openQuestions = await SurveyService.loadOpenQuestions(
        state.userId,
        state.teamId
      );

      if (openQuestions) {
        setState((prev) => ({ ...prev, openQuestions }));
      }

      return openQuestions;
    } catch (error: any) {
      console.error("Erro ao carregar respostas das perguntas abertas:", error);
      updateError(
        "openQuestions",
        error.message || "Erro ao carregar respostas das perguntas abertas"
      );
      return null;
    } finally {
      updateLoading("openQuestions", false);
    }
  }, [state.userId, state.teamId, fetchTeamMemberId]);

  // Salvar respostas das perguntas abertas
  const saveOpenQuestions = useCallback(
    async (data: OpenQuestionsFormValues): Promise<boolean> => {
      try {
        updateLoading("saving", true);

        if (!state.userId || !state.teamId) {
          const result = await fetchTeamMemberId();
          if (!result) {
            throw new Error("IDs do usuário e equipe não encontrados");
          }
        }

        if (!state.userId || !state.teamId) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }

        const success = await SurveyService.saveOpenQuestions(
          state.userId,
          state.teamId,
          data
        );

        if (success) {
          const savedData = await SurveyService.loadOpenQuestions(
            state.userId,
            state.teamId
          );
          if (savedData) {
            setState((prev) => ({
              ...prev,
              openQuestions: savedData,
              error: { ...prev.error, openQuestions: null },
            }));
          }

          const isComplete = await SurveyService.checkSurveyCompletion(
            state.userId,
            state.teamId
          );

          if (isComplete) {
            await SurveyService.updateMemberStatus(state.userId, "answered");
          }
        }

        return success;
      } catch (error: any) {
        updateError(
          "openQuestions",
          error.message || "Erro ao salvar respostas"
        );
        return false;
      } finally {
        updateLoading("saving", false);
      }
    },
    [state.userId, state.teamId, fetchTeamMemberId]
  );

  // Função para marcar todas as etapas como concluídas
  const completeAllSteps = useCallback(async () => {
    try {
      updateLoading("saving", true);

      if (!state.userId || !state.teamId) {
        const ids = await fetchTeamMemberId();
        if (!ids) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
        updateUserId(ids.userId);
        updateTeamId(ids.teamId);
      }

      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }

      const isComplete = await SurveyService.checkSurveyCompletion(
        state.userId,
        state.teamId
      );

      if (isComplete) {
        await SurveyService.updateMemberStatus(state.userId, "answered");
      }

      return isComplete;
    } catch (error: any) {
      updateError(
        "demographicData",
        error.message || "Erro ao verificar conclusão das etapas"
      );
      return false;
    } finally {
      updateLoading("saving", false);
    }
  }, [state.userId, state.teamId]);

  // Salvar respostas
  const saveAnswers = useCallback(
    async (responses: SurveyResponses): Promise<boolean> => {
      try {
        if (!state.userId || !state.teamId) {
          throw new Error("ID do usuário ou equipe não encontrado");
        }

        // Atualizar o estado imediatamente para manter a UI responsiva
        setState((prev) => ({
          ...prev,
          surveyResponses: responses,
          answers: responses,
          error: {
            ...prev.error,
            survey: null,
          },
        }));

        // Salvar no banco de dados em segundo plano
        await SurveyService.saveSurveyResponses(
          state.userId,
          state.teamId,
          responses
        );
        return true;
      } catch (error: any) {
        console.error("Erro ao salvar respostas:", error);
        updateError("survey", error.message || "Erro ao salvar respostas");
        return false;
      }
    },
    [state.userId, state.teamId]
  );

  // Função para gerar dados do radar
  const generateRadarData = useCallback(async () => {
    try {
      if (!state.surveyResponses) return;

      const radarPoints = Object.entries(state.surveyResponses).map(
        ([key, value]) => ({
          category: SurveyService.getCompetencyName(key),
          value,
        })
      );

      setRadarData(radarPoints);
    } catch (error) {
      console.error("Erro ao gerar dados do radar:", error);
    }
  }, [state.surveyResponses]);

  // Função para buscar comparação de competências
  const getCompetencyComparison = useCallback(async (teamId: string) => {
    try {
      updateLoading("survey", true);

      const data = await SurveyService.getCompetencyComparison(teamId);

      setState((prev) => ({
        ...prev,
        competencyComparison: data,
      }));

      return data;
    } catch (error: any) {
      console.error("Erro ao buscar comparação de competências:", error);
      updateError(
        "survey",
        error.message || "Erro ao buscar comparação de competências"
      );
      return [];
    } finally {
      updateLoading("survey", false);
    }
  }, []);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      console.log("Iniciando loadData com:", {
        stateUserId: state.userId,
        stateTeamId: state.teamId,
        loading: state.loading,
      });

      if (!state.userId || !state.teamId) {
        console.log("IDs ausentes, aguardando...");
        return;
      }

      updateLoading("demographicData", true);
      updateLoading("survey", true);
      updateLoading("openQuestions", true);

      const [
        demographicData,
        surveyResponses,
        openQuestions,
        competencyComparison,
      ] = await Promise.all([
        SurveyService.loadDemographicData(state.userId, state.teamId),
        SurveyService.loadSurveyResponses(state.userId, state.teamId),
        SurveyService.loadOpenQuestions(state.userId, state.teamId),
        SurveyService.getCompetencyComparison(state.teamId),
      ]);

      console.log("Dados carregados:", {
        demographicData,
        surveyResponses,
        openQuestions,
        competencyComparison,
      });

      setState((prev) => ({
        ...prev,
        demographicData,
        surveyResponses: surveyResponses?.responses || null,
        openQuestions,
        answers: surveyResponses?.responses || null,
        competencyComparison,
        error: {
          demographicData: null,
          survey: null,
          openQuestions: null,
        },
      }));
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      updateError("demographicData", error.message);
      updateError("survey", error.message);
      updateError("openQuestions", error.message);
    } finally {
      updateLoading("demographicData", false);
      updateLoading("survey", false);
      updateLoading("openQuestions", false);
    }
  }, [state.userId, state.teamId]);

  // Carregar dados iniciais quando o usuário e a equipe estiverem disponíveis
  useEffect(() => {
    if (user?.id && selectedTeam?.id) {
      console.log("Atualizando IDs no provider:", {
        userId: user.id,
        teamId: selectedTeam.id,
      });

      setState((prev) => ({
        ...prev,
        userId: user.id,
        teamId: selectedTeam.id,
        loading: {
          ...prev.loading,
          demographicData: true,
          survey: true,
          openQuestions: true,
        },
      }));
    }
  }, [user?.id, selectedTeam?.id]);

  // Carregar dados quando os IDs estiverem disponíveis no estado
  useEffect(() => {
    if (state.userId && state.teamId) {
      console.log("IDs disponíveis, carregando dados:", {
        userId: state.userId,
        teamId: state.teamId,
      });
      loadData();
    }
  }, [state.userId, state.teamId]);

  // Inicializar questões e seções
  useEffect(() => {
    const questions = [
      {
        id: "q1",
        competency: "Abertura",
        text: "O ambiente de trabalho facilita o feedback positivo ou negativo de mão dupla entre o líder e os membros da equipe?",
      },
      {
        id: "q2",
        competency: "Agilidade",
        text: "No ambiente de trabalho, você age e reage rapidamente, assume riscos, considera diferentes cenários, experimenta ideias e aprende com as falhas?",
      },
      {
        id: "q3",
        competency: "Confiança",
        text: "No ambiente de trabalho, você acredita que a relação profissional entre o líder e a equipe é baseada na confiança mútua?",
      },
      {
        id: "q4",
        competency: "Empatia",
        text: "Nas relações profissionais, você compreende, tem empatia e considera a perspectiva e os sentimentos dos outros, e percebe que o mesmo é recíproco?",
      },
      {
        id: "q5",
        competency: "Articulação",
        text: "No ambiente de trabalho, as conexões entre as competências dos membros da equipe e as externas ao squad/projeto são potencializadas, maximizadas e bem utilizadas?",
      },
      {
        id: "q6",
        competency: "Adaptabilidade",
        text: "No ambiente de trabalho, você consegue se adaptar rapidamente e responder às adversidades que ocorrem em situações não planejadas?",
      },
      {
        id: "q7",
        competency: "Inovação",
        text: "O ambiente de trabalho favorece, estimula e desenvolve as competências necessárias para a busca da inovação nos indivíduos?",
      },
      {
        id: "q8",
        competency: "Comunicação",
        text: "No ambiente de trabalho, a comunicação é facilitada e ocorre de forma fluida, permitindo que você se comunique interna e externamente através de várias formas e canais?",
      },
      {
        id: "q9",
        competency: "Descentralização",
        text: "No ambiente de trabalho diário, a tomada de decisão é participativa e compartilhada entre a gestão e a equipe, em vez de concentrada em uma pessoa?",
      },
      {
        id: "q10",
        competency: "Auto-organização",
        text: "No ambiente de trabalho, a equipe se auto-organiza e se esforça coletivamente para resolver uma tarefa complexa ou um desafio inesperado?",
      },
      {
        id: "q11",
        competency: "Colaboração",
        text: "No ambiente de trabalho, os desafios são tratados de forma colaborativa, aproveitando efetivamente as competências individuais dos membros da equipe?",
      },
      {
        id: "q12",
        competency: "Resiliência",
        text: "No ambiente de trabalho, você considera que mantém uma atitude positiva, proativa e de aprendizado diante de obstáculos e fracassos?",
      },
    ];

    setQuestions(questions);
    setState((prev) => ({
      ...prev,
      questions,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      saveAnswers,
      generateRadarData,
      saveDemographicData,
      saveSurveyResponses,
      saveOpenQuestions,
      updateUserId,
      updateTeamId,
      updateError,
      updateLoading,
      loadData,
      completeAllSteps,
      loadDemographicData,
      getCompetencyComparison,
    }),
    [
      state,
      saveAnswers,
      generateRadarData,
      saveDemographicData,
      saveSurveyResponses,
      saveOpenQuestions,
      updateUserId,
      updateTeamId,
      updateError,
      updateLoading,
      loadData,
      completeAllSteps,
      loadDemographicData,
      getCompetencyComparison,
    ]
  );

  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  );
};
