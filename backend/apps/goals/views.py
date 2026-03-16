from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Goal, GoalContribution
from .serializers import GoalSerializer, GoalContributionSerializer


class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).prefetch_related('contributions')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='contribute')
    def contribute(self, request, pk=None):
        goal = self.get_object()
        serializer = GoalContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        contrib = serializer.save(goal=goal)

        # Update current_amount
        goal.current_amount += amount
        goal.save()

        return Response({
            'contribution': GoalContributionSerializer(contrib).data,
            'goal': GoalSerializer(goal).data,
        }, status=status.HTTP_201_CREATED)
