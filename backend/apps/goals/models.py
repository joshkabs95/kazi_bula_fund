from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=100)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    icon = models.CharField(max_length=10, default='🎯')
    color = models.CharField(max_length=7, default='#c9a84c')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Objectif'
        verbose_name_plural = 'Objectifs'
        ordering = ['-created_at']

    @property
    def progress_pct(self):
        if not self.target_amount:
            return 0
        return min(100, round(float(self.current_amount) / float(self.target_amount) * 100, 1))

    @property
    def remaining(self):
        return max(0, float(self.target_amount) - float(self.current_amount))

    def __str__(self):
        return f"{self.icon} {self.name} ({self.progress_pct}%)"


class GoalContribution(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.goal.name} +{self.amount}€"
