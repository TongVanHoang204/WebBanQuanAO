import 'package:flutter/material.dart';

class CustomPagination extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final ValueChanged<int> onPageChanged;

  const CustomPagination({
    super.key,
    required this.currentPage,
    required this.totalPages,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Previous Button
          _NavigationBtn(
            icon: Icons.chevron_left,
            onTap: currentPage > 1 ? () => onPageChanged(currentPage - 1) : null,
          ),
          const SizedBox(width: 8),

          // Page Numbers
          ..._buildPageNumbers(),

          const SizedBox(width: 8),
          // Next Button
          _NavigationBtn(
            icon: Icons.chevron_right,
            onTap: currentPage < totalPages ? () => onPageChanged(currentPage + 1) : null,
          ),
        ],
      ),
    );
  }

  List<Widget> _buildPageNumbers() {
    List<Widget> buttons = [];
    final showEllipsis = totalPages > 5;

    // Helper to add a page button
    void addPageBtn(int page) {
      buttons.add(_PageBtn(
        page: page,
        isActive: currentPage == page,
        onTap: () => onPageChanged(page),
      ));
      buttons.add(const SizedBox(width: 6));
    }

    // Helper to add ellipsis
    void addEllipsis() {
      buttons.add(const Padding(
        padding: EdgeInsets.symmetric(horizontal: 4),
        child: Text('...', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
      ));
      buttons.add(const SizedBox(width: 6));
    }

    if (!showEllipsis) {
      // Show all pages if 5 or less
      for (int i = 1; i <= totalPages; i++) {
        addPageBtn(i);
      }
    } else {
      // Complex case with ellipsis
      addPageBtn(1); // Always show page 1

      if (currentPage > 3) {
        addEllipsis();
      }

      // Show middle pages
      int start = (currentPage - 1).clamp(2, totalPages - 2);
      int end = (currentPage + 1).clamp(2, totalPages - 1);
      
      // Adjust if we are at edge cases
      if (currentPage <= 3) {
        end = 3;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 2;
      }

      for (int i = start; i <= end; i++) {
        addPageBtn(i);
      }

      if (currentPage < totalPages - 2) {
        addEllipsis();
      }

      addPageBtn(totalPages); // Always show last page
    }

    if (buttons.isNotEmpty) {
      buttons.removeLast(); // Remove trailing SizedBox
    }
    
    return buttons;
  }
}

class _NavigationBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _NavigationBtn({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: disabled ? Colors.grey.shade100 : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: disabled ? Colors.transparent : Colors.grey.shade200),
          boxShadow: disabled
              ? null
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Icon(
          icon,
          size: 20,
          color: disabled ? Colors.grey.shade400 : const Color(0xFF140E1B),
        ),
      ),
    );
  }
}

class _PageBtn extends StatelessWidget {
  final int page;
  final bool isActive;
  final VoidCallback onTap;

  const _PageBtn({
    required this.page,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const primaryStr = Color(0xFF7F19E6);
    
    return GestureDetector(
      onTap: isActive ? null : onTap,
      child: Container(
        width: 36,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? primaryStr : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? primaryStr : Colors.grey.shade200,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: primaryStr.withValues(alpha: 0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Text(
          page.toString(),
          style: TextStyle(
            color: isActive ? Colors.white : const Color(0xFF140E1B),
            fontSize: 14,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
